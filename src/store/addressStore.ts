import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { generateLocalId } from '../lib/id';
import type { SavedAddress } from '../types/backend/customer';
import type { DeliveryLocation } from '../types/backend/location';

export type NewAddressInput = {
  label: string;
  address: string;
  reference?: string | null;
  location?: DeliveryLocation | null;
};

type AddressState = {
  /** true cuando ya se leyeron del teléfono (o se fijaron a mano): evita mostrar "sin direcciones" un instante. */
  loaded: boolean;
  addresses: SavedAddress[];
  /** Ya se copiaron a este teléfono las direcciones que la cuenta tenía en el servidor (una sola vez). */
  importedFromAccount: boolean;
  setAddresses: (addresses: SavedAddress[]) => void;
  add: (input: NewAddressInput) => SavedAddress;
  update: (id: string, patch: Partial<Pick<SavedAddress, 'label' | 'address' | 'reference' | 'location'>>) => void;
  remove: (id: string) => void;
  setDefault: (id: string) => void;
  markImported: () => void;
  setLoaded: (loaded: boolean) => void;
  clear: () => void;
};

/**
 * Libreta de direcciones del TELÉFONO, con persistencia local (AsyncStorage). No vive en el backend
 * ni exige cuenta: cualquiera guarda su dirección y pide más rápido. Al pedir se manda el texto de la
 * dirección (y el pin, si hay) dentro del propio pedido; el servidor ya no guarda "direcciones".
 */
export const useAddressStore = create<AddressState>()(
  persist(
    (set, get) => ({
      loaded: false,
      addresses: [],
      importedFromAccount: false,
      setAddresses: (addresses) => set({ addresses, loaded: true }),
      add: (input) => {
        const now = new Date().toISOString();
        const created: SavedAddress = {
          id: generateLocalId('addr'),
          label: input.label,
          address: input.address,
          reference: input.reference ?? null,
          location: input.location ?? null,
          // La primera dirección queda como predeterminada.
          isDefault: get().addresses.length === 0,
          createdAt: now,
          updatedAt: now,
        };
        set({ addresses: [...get().addresses, created], loaded: true });
        return created;
      },
      update: (id, patch) =>
        set({
          addresses: get().addresses.map((a) =>
            a.id === id ? { ...a, ...patch, updatedAt: new Date().toISOString() } : a,
          ),
        }),
      remove: (id) => {
        const remaining = get().addresses.filter((a) => a.id !== id);
        // Si se borra la predeterminada, la primera que quede pasa a serlo.
        if (remaining.length > 0 && !remaining.some((a) => a.isDefault)) {
          remaining[0] = { ...remaining[0], isDefault: true };
        }
        set({ addresses: remaining });
      },
      setDefault: (id) => set({ addresses: get().addresses.map((a) => ({ ...a, isDefault: a.id === id })) }),
      markImported: () => set({ importedFromAccount: true }),
      setLoaded: (loaded) => set({ loaded }),
      clear: () => set({ addresses: [], loaded: false }),
    }),
    {
      name: 'traelo.addresses.v1',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ addresses: state.addresses, importedFromAccount: state.importedFromAccount }),
      onRehydrateStorage: () => (state) => state?.setLoaded(true),
    },
  ),
);
