import { describeMissing, getMissingDeliveryDetails, type DeliveryDetailsInput } from '../deliveryDetails';

const complete: DeliveryDetailsInput = {
  isGuest: true,
  name: 'Ana Pérez',
  phone: '55551234',
  usingSavedAddress: false,
  address: 'Calle 82 #4107 entre 41 y 43',
  reference: 'Casa azul frente al parque',
};

describe('getMissingDeliveryDetails', () => {
  it('invitado con nombre, teléfono y dirección: nada falta (la referencia es opcional)', () => {
    expect(getMissingDeliveryDetails(complete)).toEqual([]);
  });

  it('la ubicación (pin) NO es un dato obligatorio: ni siquiera existe en esta validación', () => {
    expect(Object.keys(complete)).not.toContain('location');
    expect(getMissingDeliveryDetails(complete)).toEqual([]);
  });

  it('lista exactamente lo que falta', () => {
    expect(getMissingDeliveryDetails({ ...complete, name: '', phone: '123' })).toEqual(['name', 'phone']);
    expect(getMissingDeliveryDetails({ ...complete, address: 'ab', reference: '' })).toEqual(['address']);
  });

  it('los espacios no cuentan como texto', () => {
    expect(getMissingDeliveryDetails({ ...complete, address: '     ', reference: '   ' })).toEqual(['address']);
  });

  it('con cuenta el nombre y el teléfono salen de la cuenta: no se piden', () => {
    expect(getMissingDeliveryDetails({ ...complete, isGuest: false, name: '', phone: '' })).toEqual([]);
  });

  it('con una dirección guardada elegida no se pide escribir dirección', () => {
    expect(
      getMissingDeliveryDetails({ ...complete, isGuest: false, usingSavedAddress: true, address: '', reference: '' }),
    ).toEqual([]);
  });

  it('con cuenta y dirección nueva sí se pide la dirección, pero nunca la referencia', () => {
    expect(getMissingDeliveryDetails({ ...complete, isGuest: false, address: '', reference: '' })).toEqual(['address']);
    expect(getMissingDeliveryDetails({ ...complete, reference: '' })).toEqual([]);
  });
});

describe('describeMissing', () => {
  it('redacta la lista en español', () => {
    expect(describeMissing([])).toBeNull();
    expect(describeMissing(['address'])).toBe('Falta: dirección.');
    expect(describeMissing(['phone', 'address'])).toBe('Falta: teléfono y dirección.');
    expect(describeMissing(['name', 'phone', 'address'])).toBe('Falta: nombre, teléfono y dirección.');
  });
});
