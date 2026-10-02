import { ASAP_LABEL, deliveryTimeOptions, formatSlot, havanaMinutesOfDay, scheduledForValue } from '../deliveryTime';
import { buildCheckoutInput } from '../buildCheckoutInput';

// En septiembre La Habana está en UTC-4: 22:10Z = 18:10 en Cuba.
const at = (utc: string) => new Date(utc);

describe('hora de entrega (hora de Cuba)', () => {
  it('lee la hora de La Habana, no la del teléfono', () => {
    expect(havanaMinutesOfDay(at('2026-09-25T22:10:00Z'))).toBe(18 * 60 + 10);
    expect(havanaMinutesOfDay(at('2026-09-25T04:05:00Z'))).toBe(0 * 60 + 5);
  });

  it('las opciones empiezan en el próximo cuarto de hora y terminan en las 11:45 pm', () => {
    const options = deliveryTimeOptions(at('2026-09-25T22:10:00Z')); // 18:10 en Cuba
    expect(options[0]).toBe('6:15 pm');
    expect(options[1]).toBe('6:30 pm');
    expect(options[options.length - 1]).toBe('11:45 pm');
    // de 6:15 pm a 11:45 pm en pasos de 15 minutos = 23 opciones
    expect(options).toHaveLength(23);
  });

  it('a las 23:50 ya no queda ninguna hora de hoy', () => {
    expect(deliveryTimeOptions(at('2026-09-26T03:50:00Z'))).toEqual([]); // 23:50 en Cuba
  });

  it('formato de 12 horas', () => {
    expect(formatSlot(0)).toBe('12:00 am');
    expect(formatSlot(12 * 60)).toBe('12:00 pm');
    expect(formatSlot(19 * 60 + 30)).toBe('7:30 pm');
  });

  it('lo que se manda al servidor: "Lo antes posible" u "Hoy 7:30 pm"', () => {
    expect(scheduledForValue(null)).toBe(ASAP_LABEL);
    expect(scheduledForValue('7:30 pm')).toBe('Hoy 7:30 pm');
  });

  it('viaja en el pedido junto con el tipo y el agrego elegidos (solo nombres, nunca precios)', () => {
    const input = buildCheckoutInput({
      items: [
        {
          productId: 'p1',
          businessId: 'b1',
          quantity: 2,
          nameSnapshot: 'Batido',
          priceSnapshot: 400,
          imageUrlSnapshot: null,
          optionName: 'Fresa',
          addonName: 'Queso',
          packagingName: 'Bolsa',
        },
      ],
      clientRequestId: 'req-12345678',
      scheduledFor: 'Hoy 7:30 pm',
      address: 'Calle 82',
    });
    expect(input.scheduledFor).toBe('Hoy 7:30 pm');
    expect(input.businesses[0].items[0]).toMatchObject({ optionName: 'Fresa', addonName: 'Queso', packagingName: 'Bolsa' });
    expect(JSON.stringify(input)).not.toMatch(/addonPrice|packagingPrice/);
  });
});
