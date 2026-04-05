import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

type ProductPathSource = {
  id?: number | string | null;
  slug?: string | null;
};

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
  }).format(price);
}

export function buildProductPath(product: ProductPathSource): string {
  const slug = product.slug?.trim();

  if (slug) {
    return `/product/${slug}`;
  }

  if (product.id !== undefined && product.id !== null && product.id !== '') {
    return `/product/${product.id}`;
  }

  return '/';
}
