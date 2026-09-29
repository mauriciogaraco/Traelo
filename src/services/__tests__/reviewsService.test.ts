import { submitOrderReviews } from '../reviewsService';
import { getOrderReviews, submitBusinessReviews, submitDelivererReview, submitOrderComment } from '../../api/orderAccess';
import { ApiError } from '../../api/ApiError';
import type { OrderReviewState } from '../../types/backend/review';

vi.mock('../../api/orderAccess');
const getMock = getOrderReviews as ReturnType<typeof vi.mocked<typeof getOrderReviews>>;
const delivererMock = submitDelivererReview as ReturnType<typeof vi.mocked<typeof submitDelivererReview>>;
const businessesMock = submitBusinessReviews as ReturnType<typeof vi.mocked<typeof submitBusinessReviews>>;
const commentMock = submitOrderComment as ReturnType<typeof vi.mocked<typeof submitOrderComment>>;

const access = { kind: 'customer' } as const;

const state = (overrides: Partial<OrderReviewState> = {}): OrderReviewState => ({
  orderId: 'o1',
  orderNumber: 10,
  canReview: true,
  deliverer: { delivererName: 'Yoandry', status: 'pending', rating: null },
  businesses: [
    { businessId: 'bA', businessName: 'Pizzería', status: 'pending', rating: null },
    { businessId: 'bB', businessName: 'Dulcería', status: 'pending', rating: null },
  ],
  hasPending: true,
  ...overrides,
});

const submitted = (rating: number) => ({ status: 'submitted' as const, rating });

beforeEach(() => {
  vi.resetAllMocks();
});

describe('submitOrderReviews', () => {
  it('envía mensajero y negocios elegidos, partiendo del estado real del servidor', async () => {
    const afterDeliverer = state({ deliverer: { delivererName: 'Yoandry', ...submitted(4.7) } });
    const afterAll = state({
      deliverer: { delivererName: 'Yoandry', ...submitted(4.7) },
      businesses: [
        { businessId: 'bA', businessName: 'Pizzería', ...submitted(5) },
        { businessId: 'bB', businessName: 'Dulcería', status: 'pending', rating: null },
      ],
      hasPending: true,
    });
    getMock.mockResolvedValueOnce(state());
    delivererMock.mockResolvedValueOnce(afterDeliverer);
    businessesMock.mockResolvedValueOnce(afterAll);

    const outcome = await submitOrderReviews('o1', access, {
      deliverer: 4.7,
      businesses: [{ businessId: 'bA', rating: 5 }],
    });

    expect(outcome).toEqual({ ok: true, state: afterAll });
    expect(delivererMock).toHaveBeenCalledWith('o1', 4.7, access);
    expect(businessesMock).toHaveBeenCalledWith('o1', [{ businessId: 'bA', rating: 5 }], access);
  });

  it('nunca envía un id de mensajero: solo el rating', async () => {
    getMock.mockResolvedValueOnce(state());
    delivererMock.mockResolvedValueOnce(state());
    await submitOrderReviews('o1', access, { deliverer: 3.2, businesses: [] });
    expect(delivererMock.mock.calls[0]).toEqual(['o1', 3.2, access]);
  });

  it('solo valora lo elegido: si no hay mensajero elegido, no lo envía', async () => {
    getMock.mockResolvedValueOnce(state());
    businessesMock.mockResolvedValueOnce(state());
    await submitOrderReviews('o1', access, { businesses: [{ businessId: 'bB', rating: 2.5 }] });
    expect(delivererMock).not.toHaveBeenCalled();
    expect(businessesMock).toHaveBeenCalledWith('o1', [{ businessId: 'bB', rating: 2.5 }], access);
  });

  it('un reintento tras un fallo a medias NO repite lo ya guardado (mensajero ya "submitted")', async () => {
    // El primer intento guardó al mensajero y falló en los negocios; ahora el servidor lo dice.
    getMock.mockResolvedValueOnce(state({ deliverer: { delivererName: 'Yoandry', ...submitted(4.7) } }));
    businessesMock.mockResolvedValueOnce(state());

    const outcome = await submitOrderReviews('o1', access, {
      deliverer: 4.7,
      businesses: [{ businessId: 'bA', rating: 5 }],
    });

    expect(outcome.ok).toBe(true);
    expect(delivererMock).not.toHaveBeenCalled();
    expect(businessesMock).toHaveBeenCalledTimes(1);
  });

  it('filtra los negocios que el servidor ya tiene valorados', async () => {
    getMock.mockResolvedValueOnce(
      state({
        businesses: [
          { businessId: 'bA', businessName: 'Pizzería', ...submitted(5) },
          { businessId: 'bB', businessName: 'Dulcería', status: 'pending', rating: null },
        ],
      }),
    );
    businessesMock.mockResolvedValueOnce(state());
    await submitOrderReviews('o1', access, {
      businesses: [
        { businessId: 'bA', rating: 1 },
        { businessId: 'bB', rating: 4 },
      ],
    });
    expect(businessesMock).toHaveBeenCalledWith('o1', [{ businessId: 'bB', rating: 4 }], access);
  });

  it('duplicado (409 REVIEW_ALREADY_SUBMITTED) no es un error: relee el estado y sigue', async () => {
    const reread = state({ deliverer: { delivererName: 'Yoandry', ...submitted(4) }, hasPending: false, businesses: [] });
    getMock.mockResolvedValueOnce(state()).mockResolvedValueOnce(reread);
    delivererMock.mockRejectedValueOnce(new ApiError('REVIEW_ALREADY_SUBMITTED', 'Ya enviaste', undefined, 409));

    const outcome = await submitOrderReviews('o1', access, { deliverer: 4, businesses: [] });

    expect(outcome).toEqual({ ok: true, state: reread });
  });

  it('sin conexión: falla como reintentable y no hay estado parcial inventado', async () => {
    getMock.mockResolvedValueOnce(state());
    delivererMock.mockRejectedValueOnce(new ApiError('NETWORK_ERROR', 'No pudimos conectar con Tráelo.'));

    const outcome = await submitOrderReviews('o1', access, { deliverer: 4, businesses: [] });

    expect(outcome).toMatchObject({ ok: false, code: 'NETWORK_ERROR', retryable: true });
  });

  it('error del servidor (5xx) y timeout también son reintentables; un 4xx de negocio no', async () => {
    getMock.mockResolvedValue(state());
    delivererMock.mockRejectedValueOnce(new ApiError('SERVER_ERROR', 'x', undefined, 500));
    expect(await submitOrderReviews('o1', access, { deliverer: 4, businesses: [] })).toMatchObject({ retryable: true });

    delivererMock.mockRejectedValueOnce(new ApiError('REQUEST_TIMEOUT', 'x'));
    expect(await submitOrderReviews('o1', access, { deliverer: 4, businesses: [] })).toMatchObject({ retryable: true });

    delivererMock.mockRejectedValueOnce(new ApiError('ORDER_NOT_COMPLETED', 'x', undefined, 409));
    expect(await submitOrderReviews('o1', access, { deliverer: 4, businesses: [] })).toMatchObject({
      ok: false,
      code: 'ORDER_NOT_COMPLETED',
      retryable: false,
    });
  });

  it('pedido todavía no entregado: no envía nada', async () => {
    getMock.mockResolvedValueOnce(state({ canReview: false, hasPending: false }));
    const outcome = await submitOrderReviews('o1', access, { deliverer: 5, businesses: [] });
    expect(outcome).toMatchObject({ ok: false, code: 'ORDER_NOT_COMPLETED', retryable: false });
    expect(delivererMock).not.toHaveBeenCalled();
    expect(businessesMock).not.toHaveBeenCalled();
  });

  it('opinión libre: se manda además de (o en vez de) las estrellas, recortando espacios', async () => {
    getMock.mockResolvedValueOnce(state());
    delivererMock.mockResolvedValueOnce(state());
    commentMock.mockResolvedValueOnce({ ok: true });

    await submitOrderReviews('o1', access, { deliverer: 4, businesses: [], comment: '  Muy rápido  ' });

    expect(commentMock).toHaveBeenCalledWith('o1', 'Muy rápido', access);
  });

  it('opinión vacía o solo espacios: no se manda nada', async () => {
    getMock.mockResolvedValueOnce(state());
    await submitOrderReviews('o1', access, { businesses: [], comment: '   ' });
    expect(commentMock).not.toHaveBeenCalled();
  });

  it('si falla el envío de la opinión, no afecta el resultado (mejor esfuerzo)', async () => {
    getMock.mockResolvedValueOnce(state());
    delivererMock.mockResolvedValueOnce(state({ hasPending: false }));
    commentMock.mockRejectedValueOnce(new ApiError('NETWORK_ERROR', 'No pudimos conectar con Tráelo.'));

    const outcome = await submitOrderReviews('o1', access, { deliverer: 4, businesses: [], comment: 'Todo bien' });

    expect(outcome.ok).toBe(true);
  });

  it('un error inesperado se traduce a un mensaje seguro', async () => {
    getMock.mockRejectedValueOnce(new TypeError('undefined is not a function'));
    const outcome = await submitOrderReviews('o1', access, { deliverer: 5, businesses: [] });
    expect(outcome).toMatchObject({ ok: false, code: 'UNKNOWN_ERROR' });
    expect((outcome as { message: string }).message).not.toMatch(/undefined/);
  });
});
