export type DeliveryAddress = {
  id: string;
  fullName: string;
  phoneNumber: string;
  city: string;
  houseNumber: string;
  note: string;
};

export type AccountAddressLike = {
  id: string;
  fullname: string;
  phone: string;
  address: string;
  city: string;
  district?: string;
  ward?: string;
  note?: string;
  isDefault?: boolean;
};

export const DELIVERY_STORAGE_KEY = 'technova.delivery-addresses';
export const DELIVERY_SYNC_EVENT = 'technova:delivery-addresses-updated';

const normalizeText = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

export const mapAccountAddressToDeliveryAddress = (address: AccountAddressLike): DeliveryAddress => {
  const ward = normalizeText(address.ward);
  const district = normalizeText(address.district);
  const street = normalizeText(address.address);
  const city = normalizeText(address.city);
  const explicitNote = normalizeText(address.note);

  const houseNumber = street;
  const note = explicitNote || [ward, district].filter(Boolean).join(', ');

  return {
    id: normalizeText(address.id) || `${Date.now()}`,
    fullName: normalizeText(address.fullname),
    phoneNumber: normalizeText(address.phone),
    city,
    houseNumber,
    note,
  };
};

export const readDeliveryAddressesFromStorage = (): DeliveryAddress[] => {
  if (typeof window === 'undefined') {
    return [];
  }

  const raw = window.localStorage.getItem(DELIVERY_STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter(
        (item: unknown): item is Partial<DeliveryAddress> =>
          typeof (item as { id?: unknown })?.id === 'string' &&
          typeof (item as { city?: unknown })?.city === 'string' &&
          typeof (item as { houseNumber?: unknown })?.houseNumber === 'string',
      )
      .map((item) => ({
        id: normalizeText(item.id),
        fullName: normalizeText(item.fullName),
        phoneNumber: normalizeText(item.phoneNumber),
        city: normalizeText(item.city),
        houseNumber: normalizeText(item.houseNumber),
        note: normalizeText(item.note),
      }))
      .filter((item) => item.id && item.city && item.houseNumber);
  } catch {
    return [];
  }
};

export const syncDeliveryAddressesFromAccount = (addresses: AccountAddressLike[]): void => {
  if (typeof window === 'undefined') {
    return;
  }

  const mapped = addresses.map(mapAccountAddressToDeliveryAddress);
  window.localStorage.setItem(DELIVERY_STORAGE_KEY, JSON.stringify(mapped));
  window.dispatchEvent(new CustomEvent(DELIVERY_SYNC_EVENT, { detail: mapped }));
};
