/** DTOs de /api/v1/auth/customer — ver docs/BACKEND_API.md. */
import type { Customer } from './customer';

export type AuthTokens = {
  accessToken: string;
  /** Segundos de vida del access token: la app renueva un poco antes de que venza. */
  accessTokenExpiresIn: number;
  refreshToken: string;
};

export type AuthSession = AuthTokens & { customer: Customer };

export type ForgotPasswordResult = {
  /** Dato global del servidor (¿hay un canal de entrega configurado?), no depende de la cuenta. */
  channelAvailable: boolean;
  message: string;
};
