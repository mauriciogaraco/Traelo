import { ApiError } from '../../api/ApiError';

/**
 * Validación de los formularios de cuenta. Solo para dar feedback inmediato: el backend valida
 * de nuevo y es quien decide (contraseña de 8 a 72 BYTES; el teléfono lo restringe ya `PhoneField`
 * a 8 dígitos cubanos, el "+53" es fijo — ver CUBAN_PHONE_DIGITS en components/PhoneField.tsx).
 */

export const PASSWORD_MIN_BYTES = 8;
export const PASSWORD_MAX_BYTES = 72;

/** Bytes UTF-8 de un texto (bcrypt cuenta bytes, no caracteres: una "é" son 2). */
export function utf8ByteLength(text: string): number {
  let bytes = 0;
  for (const char of text) {
    const code = char.codePointAt(0) as number;
    bytes += code <= 0x7f ? 1 : code <= 0x7ff ? 2 : code <= 0xffff ? 3 : 4;
  }
  return bytes;
}

/** `digits` son los 8 dígitos locales que entrega `PhoneField` (el "+53" ya no se valida acá). */
export function validatePhone(digits: string): string | null {
  return /^\d{8}$/.test(digits) ? null : 'Escribe los 8 dígitos del teléfono.';
}

export function validateName(raw: string): string | null {
  return raw.trim().length >= 2 ? null : 'Escribe tu nombre.';
}

export function validatePassword(password: string): string | null {
  const bytes = utf8ByteLength(password);
  if (bytes < PASSWORD_MIN_BYTES) return 'La contraseña debe tener al menos 8 caracteres.';
  if (bytes > PASSWORD_MAX_BYTES) return 'La contraseña es demasiado larga (máximo 72 bytes).';
  return null;
}

export function validatePasswordConfirmation(password: string, confirmation: string): string | null {
  return password === confirmation ? null : 'Las contraseñas no coinciden.';
}

/** Correo opcional: vacío es válido. */
export function validateOptionalEmail(raw: string): string | null {
  const email = raw.trim();
  if (email === '') return null;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? null : 'Escribe un correo válido o déjalo vacío.';
}

/** Mensaje para la persona a partir de un error del backend (nunca un stack ni un código crudo). */
export function authErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.code) {
      case 'INVALID_CREDENTIALS':
        return 'Teléfono o contraseña incorrectos.';
      case 'PHONE_ALREADY_REGISTERED':
        return 'Ya existe una cuenta con ese teléfono. Inicia sesión.';
      case 'RATE_LIMITED':
        return 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.';
      case 'INVALID_RESET_TOKEN':
        return 'El código es inválido o ya venció.';
      default:
        return error.message;
    }
  }
  return 'Ocurrió un error inesperado. Inténtalo de nuevo.';
}
