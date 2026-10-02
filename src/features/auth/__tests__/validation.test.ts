import { ApiError } from '../../../api/ApiError';
import {
  authErrorMessage,
  utf8ByteLength,
  validateName,
  validateOptionalEmail,
  validatePassword,
  validatePasswordConfirmation,
  validatePhone,
} from '../validation';

describe('validación de formularios de cuenta', () => {
  it('utf8ByteLength cuenta bytes, no caracteres', () => {
    expect(utf8ByteLength('abc')).toBe(3);
    expect(utf8ByteLength('é')).toBe(2);
    expect(utf8ByteLength('€')).toBe(3);
    expect(utf8ByteLength('😀')).toBe(4);
  });

  it('contraseña: 8 a 72 BYTES (mismo criterio que el backend)', () => {
    expect(validatePassword('1234567')).not.toBeNull();
    expect(validatePassword('12345678')).toBeNull();
    expect(validatePassword('a'.repeat(72))).toBeNull();
    expect(validatePassword('a'.repeat(73))).not.toBeNull();
    // 36 letras con acento = 72 bytes; 37 = 74.
    expect(validatePassword('é'.repeat(36))).toBeNull();
    expect(validatePassword('é'.repeat(37))).not.toBeNull();
  });

  it('confirmación de contraseña', () => {
    expect(validatePasswordConfirmation('clave-123', 'clave-123')).toBeNull();
    expect(validatePasswordConfirmation('clave-123', 'clave-124')).not.toBeNull();
  });

  it('teléfono: exige exactamente los 8 dígitos locales (el +53 es fijo en PhoneField)', () => {
    expect(validatePhone('55551234')).toBeNull();
    expect(validatePhone('1234567')).not.toBeNull();
    expect(validatePhone('123456789')).not.toBeNull();
    expect(validatePhone('')).not.toBeNull();
  });

  it('nombre y correo opcional', () => {
    expect(validateName('A')).not.toBeNull();
    expect(validateName(' Ana ')).toBeNull();
    expect(validateOptionalEmail('')).toBeNull();
    expect(validateOptionalEmail('ana@mail.com')).toBeNull();
    expect(validateOptionalEmail('ana@')).not.toBeNull();
  });

  it('authErrorMessage traduce los códigos del backend a texto para la persona', () => {
    expect(authErrorMessage(new ApiError('INVALID_CREDENTIALS', 'x', undefined, 401))).toMatch(/incorrectos/);
    expect(authErrorMessage(new ApiError('PHONE_ALREADY_REGISTERED', 'x', undefined, 409))).toMatch(/Inicia sesión/);
    expect(authErrorMessage(new ApiError('RATE_LIMITED', 'x', undefined, 429))).toMatch(/Demasiados intentos/);
    expect(authErrorMessage(new ApiError('NETWORK_ERROR', 'No pudimos conectar con Tráelo.'))).toBe('No pudimos conectar con Tráelo.');
    expect(authErrorMessage(new TypeError('boom'))).not.toMatch(/boom/);
  });
});
