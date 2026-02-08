import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Trash2, ShoppingCart, Eye } from 'lucide-react';
import { WishlistItem } from '../../types/wishlist.types';
import { useWishlist } from '../../contexts/WishlistContext';
import { useCart } from '../../contexts/CartContext';
import { LiquidButton } from '../ui/LiquidButton';
import { formatPrice } from '../../lib/utils';
import toast from 'react-hot-toast';

interface WishlistItemCardProps {
  item: WishlistItem;
}

export const WishlistItemCard: React.FC<WishlistItemCardProps> = ({ item }) => {
  const { removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();
  const product = item.product ?? item.variant?.product;
  const variantId = item.variant_id ?? item.variant?.id ?? product?.variants?.[0]?.id;
  const productId = item.product_id ?? product?.id ?? item.variant?.product_id;
  const removableId = variantId ?? productId;

  const price = item.variant?.final_price ?? product?.base_price ?? 0;
  const productName = product?.name ?? 'Sản phẩm không khả dụng';
  const productDescription = product?.description ?? 'San pham da bi xoa hoac khong con thong tin.';
  const imageUrl = product?.images?.find((image) => image.is_primary)?.image_url ?? product?.images?.[0]?.image_url ?? '/placeholder.png';
  const productHref = product?.id ? `/product/${product.id}` : '/';

  const handleAddToCart = async () => {
    if (!variantId) {
      toast.error('San pham khong co phien ban kha dung');
      return;
    }

    try {
      await addToCart({ variant_id: variantId, quantity: 1 });
      toast.success('Da them vao gio hang');
    } catch (error) {
      console.error('Failed to add wishlist item to cart:', error);
      toast.error('Khong the cap nhat gio hang');
    }
  };

  return (
    <div className="group relative overflow-hidden rounded-2xl bg-white border border-gray-200 transition-all duration-300 hover:border-gray-300 hover:shadow-md flex flex-col md:flex-row">
      <Link href={productHref} className="w-full md:w-48 h-48 md:h-auto relative bg-gray-100 flex-shrink-0">
        <Image
          src={imageUrl}
          alt={productName}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 192px"
        />
        {item.priority && (
          <div className="absolute top-2 left-2 px-2 py-1 bg-black/70 rounded text-xs font-medium text-[#CA8A04] border border-[#CA8A04]/40">
            {item.priority.toUpperCase()}
          </div>
        )}
      </Link>

      <div className="p-6 flex flex-col flex-grow justify-between">
        <div className="flex justify-between items-start">
          <div>
            <Link href={productHref} className="text-xl font-heading font-bold text-gray-900 mb-1 block hover:text-[#B47B04] transition-colors">
              {productName}
            </Link>
            <p className="text-gray-600 text-sm line-clamp-2 mb-2">{productDescription}</p>
            <div className="text-[#B47B04] font-bold text-xl">
              {typeof price === 'number' ? formatPrice(price) : price}
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (removableId) {
                void removeFromWishlist(removableId);
              }
            }}
            disabled={!removableId}
            className="text-gray-400 hover:text-red-500 transition-colors p-2 -mr-2 disabled:opacity-40"
            aria-label="Remove item"
          >
            <Trash2 size={20} />
          </button>
        </div>

        <div className="flex flex-wrap gap-3 mt-6">
          <LiquidButton
            variant="primary"
            size="sm"
            className="flex-1 min-w-[180px]"
            onClick={() => {
              void handleAddToCart();
            }}
          >
            <div className="flex items-center justify-center gap-2">
              <ShoppingCart size={18} />
              Them vao gio
            </div>
          </LiquidButton>

          <Link href={productHref} className="flex-1 min-w-[180px]">
            <LiquidButton variant="ghost" size="sm" className="w-full border border-gray-300 text-gray-700 hover:text-gray-900 hover:bg-gray-100">
              <div className="flex items-center justify-center gap-2">
                <Eye size={18} />
                Xem san pham
              </div>
            </LiquidButton>
          </Link>
        </div>
      </div>
    </div>
  );
};
