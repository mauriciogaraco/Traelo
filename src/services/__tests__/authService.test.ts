import {
  __resetAuthForTests,
  __setTokensForTests,
  getAccessToken,
  hydrateAuth,
  loginWithPassword,
  logout,
  refreshAccessToken,
  registerAccount,
} from '../authService';
import { loginCustomer, logoutCustomer, refreshCustomerSession, registerCustomer } from '../../api/auth';
import { ApiError } from '../../api/ApiError';
import { getMyProfile } from '../../api/customers';
import { authStorage } from '../../storage/authStorage';
import { useFavoritesStore } from '../../store/favoritesStore';
import { useSessionStore } from '../../store/sessionStore';
import type { AuthSession } from '../../types/backend/auth';
import type { Customer } from '../../types/backend/customer';

vi.mock('../../api/auth');
vi.mock('../../api/customers');

const loginMock = vi.mocked(loginCustomer);
const registerMock = vi.mocked(registerCustomer);
const refreshMock = vi.mocked(refreshCustomerSession);
const logoutMock = vi.mocked(logoutCustomer);
const profileMock = vi.mocked(getMyProfile);

const customer: Customer = {
  id: 'c1',
  name: 'Ana',
  phone: '+5355551234',
  email: null,
  phoneVerified: false,
  emailVerified: false,
  pointsBalance: 0,
  lastOrderAt: null,
  createdAt: '2026-09-18T10:00:00.000Z',
  updatedAt: '2026-09-18T10:00:00.000Z',
};

const session = (overrides: Partial<AuthSession> = {}): AuthSession => ({
  customer,
  accessToken: 'access-1',
  accessTokenExpiresIn: 900,
  refreshToken: 'refresh-1',
  ...overrides,
});

const status = () => useSessionStore.getState().status;

beforeEach(async () => {
  vi.clearAllMocks();
  __resetAuthForTests();
  await authStorage.removeItem('traelo.auth.tokens');
  await authStorage.removeItem('traelo.auth.profile');
  useSessionStore.setState({ status: 'LOADING', customer: null });
  useFavoritesStore.getState().clear();
});

describe('login / registro', () => {
  it('login: guarda los tokens, publica AUTHENTICATED y limpia cachés de otra sesión', async () => {
    useFavoritesStore.getState().setFavorites({ businesses: [{ businessId: 'b', name: 'X', phone: '', address: '', createdAt: '' }], products: [] });
    loginMock.mockResolvedValueOnce(session());

    await loginWithPassword({ phone: '+5355551234', password: 'clave-segura-1' });

    expect(status()).toBe('AUTHENTICATED');
    expect(useSessionStore.getState().customer?.id).toBe('c1');
    expect(useFavoritesStore.getState().loaded).toBe(false);
    expect(await getAccessToken()).toBe('access-1');
    expect(await authStorage.getItem('traelo.auth.tokens')).toContain('refresh-1');
  });

  it('login con credenciales inválidas: propaga el error y sigue como invitado (nada guardado)', async () => {
    loginMock.mockRejectedValueOnce(new ApiError('INVALID_CREDENTIALS', 'Teléfono o contraseña incorrectos', undefined, 401));
    await expect(loginWithPassword({ phone: '1', password: 'x' })).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' });
    expect(status()).toBe('LOADING'); // no cambió: la pantalla de login lo muestra como error
    expect(await authStorage.getItem('traelo.auth.tokens')).toBeNull();
  });

  it('registro: deja la sesión iniciada', async () => {
    registerMock.mockResolvedValueOnce(session());
    await registerAccount({ name: 'Ana', phone: '+5355551234', password: 'clave-segura-1' });
    expect(status()).toBe('AUTHENTICATED');
  });
});

describe('hydrateAuth (arranque: nunca pide login)', () => {
  it('sin sesión guardada → invitado, sin llamar a la API', async () => {
    await hydrateAuth();
    expect(status()).toBe('GUEST');
    expect(profileMock).not.toHaveBeenCalled();
  });

  it('con sesión guardada → autenticado con el perfil en caché y lo valida en segundo plano', async () => {
    loginMock.mockResolvedValueOnce(session());
    await loginWithPassword({ phone: '+5355551234', password: 'x' });
    // Simula cerrar y volver a abrir la app.
    __resetAuthForTests();
    useSessionStore.setState({ status: 'LOADING', customer: null });
    profileMock.mockResolvedValueOnce({ ...customer, name: 'Ana Actualizada' });

    await hydrateAuth();

    expect(status()).toBe('AUTHENTICATED');
    expect(useSessionStore.getState().customer?.name).toBe('Ana Actualizada');
  });

  it('sin conexión al arrancar: sigue autenticado con el perfil en caché (no cierra la sesión)', async () => {
    loginMock.mockResolvedValueOnce(session());
    await loginWithPassword({ phone: '+5355551234', password: 'x' });
    __resetAuthForTests();
    useSessionStore.setState({ status: 'LOADING', customer: null });
    profileMock.mockRejectedValueOnce(new ApiError('NETWORK_ERROR', 'sin red'));

    await hydrateAuth();

    expect(status()).toBe('AUTHENTICATED');
    expect(useSessionStore.getState().customer?.name).toBe('Ana');
    expect(await authStorage.getItem('traelo.auth.tokens')).not.toBeNull();
  });

  it('datos guardados corruptos → invitado, sin romper', async () => {
    await authStorage.setItem('traelo.auth.tokens', '{no es json');
    await hydrateAuth();
    expect(status()).toBe('GUEST');
  });
});

describe('refresh de un solo vuelo', () => {
  beforeEach(() => {
    __setTokensForTests({ accessToken: 'access-1', accessTokenExpiresIn: 900, refreshToken: 'refresh-1' });
  });

  it('varias peticiones que reciben 401 a la vez comparten UNA sola renovación', async () => {
    let resolveRefresh: (value: { accessToken: string; accessTokenExpiresIn: number; refreshToken: string }) => void = () => undefined;
    refreshMock.mockReturnValueOnce(new Promise((resolve) => (resolveRefresh = resolve)));

    const calls = [refreshAccessToken('access-1'), refreshAccessToken('access-1'), refreshAccessToken('access-1')];
    resolveRefresh({ accessToken: 'access-2', accessTokenExpiresIn: 900, refreshToken: 'refresh-2' });

    await expect(Promise.all(calls)).resolves.toEqual(['access-2', 'access-2', 'access-2']);
    expect(refreshMock).toHaveBeenCalledTimes(1);
    expect(refreshMock).toHaveBeenCalledWith('refresh-1');
  });

  it('si otra petición ya renovó, no vuelve a renovar: usa el token vigente', async () => {
    refreshMock.mockResolvedValueOnce({ accessToken: 'access-2', accessTokenExpiresIn: 900, refreshToken: 'refresh-2' });
    await refreshAccessToken('access-1');

    // Una petición rezagada falló con el token viejo 'access-1'.
    await expect(refreshAccessToken('access-1')).resolves.toBe('access-2');
    expect(refreshMock).toHaveBeenCalledTimes(1);
  });

  it('refresh token rechazado (401): cierra la sesión y vuelve a invitado', async () => {
    useSessionStore.setState({ status: 'AUTHENTICATED', customer });
    refreshMock.mockRejectedValueOnce(new ApiError('INVALID_REFRESH_TOKEN', 'Sesión expirada', undefined, 401));

    await expect(refreshAccessToken('access-1')).resolves.toBeNull();

    expect(status()).toBe('GUEST');
    expect(await getAccessToken()).toBeNull();
    expect(await authStorage.getItem('traelo.auth.tokens')).toBeNull();
  });

  it('fallo de RED al renovar: lanza y NO cierra la sesión', async () => {
    useSessionStore.setState({ status: 'AUTHENTICATED', customer });
    refreshMock.mockRejectedValueOnce(new ApiError('NETWORK_ERROR', 'sin red'));

    await expect(refreshAccessToken('access-1')).rejects.toMatchObject({ code: 'NETWORK_ERROR' });

    expect(status()).toBe('AUTHENTICATED');
    // Y se puede volver a intentar (no quedó un vuelo colgado).
    refreshMock.mockResolvedValueOnce({ accessToken: 'access-2', accessTokenExpiresIn: 900, refreshToken: 'refresh-2' });
    await expect(refreshAccessToken('access-1')).resolves.toBe('access-2');
  });

  it('getAccessToken renueva ANTES de que venza el token', async () => {
    __setTokensForTests({ accessToken: 'casi-vencido', accessTokenExpiresIn: 10, refreshToken: 'refresh-1' });
    refreshMock.mockResolvedValueOnce({ accessToken: 'access-2', accessTokenExpiresIn: 900, refreshToken: 'refresh-2' });

    await expect(getAccessToken()).resolves.toBe('access-2');
  });

  it('getAccessToken sin red para renovar usa el token que hay (el servidor decidirá)', async () => {
    __setTokensForTests({ accessToken: 'casi-vencido', accessTokenExpiresIn: 10, refreshToken: 'refresh-1' });
    refreshMock.mockRejectedValueOnce(new ApiError('NETWORK_ERROR', 'sin red'));

    await expect(getAccessToken()).resolves.toBe('casi-vencido');
  });

  it('sin sesión: no hay token y no se intenta renovar', async () => {
    __resetAuthForTests();
    await expect(getAccessToken()).resolves.toBeNull();
    await expect(refreshAccessToken('x')).resolves.toBeNull();
    expect(refreshMock).not.toHaveBeenCalled();
  });
});

describe('logout', () => {
  beforeEach(async () => {
    loginMock.mockResolvedValueOnce(session());
    await loginWithPassword({ phone: '+5355551234', password: 'x' });
  });

  it('revoca el token en el servidor y vuelve a invitado sin datos de sesión', async () => {
    logoutMock.mockResolvedValueOnce(undefined);

    await logout();

    expect(logoutMock).toHaveBeenCalledWith('refresh-1');
    expect(status()).toBe('GUEST');
    expect(useSessionStore.getState().customer).toBeNull();
    expect(await getAccessToken()).toBeNull();
    expect(await authStorage.getItem('traelo.auth.tokens')).toBeNull();
    expect(await authStorage.getItem('traelo.auth.profile')).toBeNull();
  });

  it('sin conexión igual cierra la sesión local', async () => {
    logoutMock.mockRejectedValueOnce(new ApiError('NETWORK_ERROR', 'sin red'));
    await logout();
    expect(status()).toBe('GUEST');
    expect(await getAccessToken()).toBeNull();
  });
});
