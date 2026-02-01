'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CartContextType, Cart, AddToCartDto, UpdateCartItemDto, CartItem, Product, ProductVariant, CartItemVariant } from '@/types';
import { CartStatus } from '@/types/order.types';
import { cartApi, productApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

const CART_STORAGE_KEY = 'cart:state';
const CART_USER_KEY = 'cart:user_id';

const CartContext = createContext<CartContextType | undefined>(undefined);

interface CartItemWithVariant extends CartItem {
  variant?: ProductVariant & { product?: Product };
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [itemCount, setItemCount] = useState(0);
  const { isAuthenticated, isLoading: isAuthLoading, user } = useAuth();
  const wasAuthenticated = React.useRef<boolean | null>(null);

  const calculateItemCount = (cartData: Cart | null): number => {
    if (!cartData || !cartData.items) {
      return 0;
    }
    return cartData.items.reduce((sum, item) => sum + item.quantity, 0);
  };

  const persistCart = (cartData: Cart | null) => {
    try {
      if (cartData) {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartData));
      } else {
        localStorage.removeItem(CART_STORAGE_KEY);
      }
    } catch (error) {
      console.error('Failed to persist cart to localStorage:', error);
    }
  };

  const clearLocalCart = useCallback(() => {
    setCart(null);
    setItemCount(0);
    try {
      localStorage.removeItem(CART_STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear cart from localStorage:', error);
    }
  }, []);

  const loadCartFromStorage = useCallback(() => {
    try {
      if (user?.id) {
        const storedUserId = localStorage.getItem(CART_USER_KEY);
        if (storedUserId && storedUserId !== String(user.id)) {
          clearLocalCart();
          localStorage.setItem(CART_USER_KEY, String(user.id));
          return;
        }
      }
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        const parsedCart: Cart = JSON.parse(stored);
        setCart(parsedCart);
        setItemCount(calculateItemCount(parsedCart));
      } else {
        setCart(null);
        setItemCount(0);
      }
    } catch (error) {
      console.error('Failed to load cart from localStorage:', error);
    }
  }, [clearLocalCart, user]);

  const syncWithAPI = useCallback(async (): Promise<Cart | null> => {
    setIsLoading(true);
    try {
      const serverCart = await cartApi.getCart();
      const serverItems = (serverCart.items ?? []) as Array<
        CartItem & { product?: { id?: number } | null; variant?: CartItemVariant | null }
      >;

      const enrichedItems = await Promise.all(
        serverItems.map(async (item) => {
          const variant = item.variant ?? undefined;
          const productId = variant?.product_id ?? item.product?.id;
          let product: Product | undefined;

          if (productId) {
            try {
              product = await productApi.getProductById(productId);
            } catch (error) {
              console.error('Failed to fetch product for cart item:', error);
            }
          }

          const variantFromProduct = product?.variants?.find((entry) => entry.id === item.variant_id);
          const baseVariant = variantFromProduct ?? variant;
          const variantWithProduct = baseVariant
            ? { ...baseVariant, product }
            : null;

          return {
            ...item,
            variant: variantWithProduct,
          };
        })
      );

      const enrichedCart: Cart = {
        ...serverCart,
        items: enrichedItems,
        item_count: calculateItemCount({ ...serverCart, items: enrichedItems }),
      };

      setCart(enrichedCart);
      setItemCount(calculateItemCount(enrichedCart));
      persistCart(enrichedCart);

      return enrichedCart;
    } catch (error) {
      console.error('Failed to sync cart with API:', error);
      loadCartFromStorage();
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [loadCartFromStorage]);

  const addToCart = useCallback(async (data: AddToCartDto, product?: Product, variant?: ProductVariant): Promise<Cart> => {
    const safeQuantity = data.quantity && data.quantity > 0 ? data.quantity : 1;
    const now = new Date();
    const variantWithProduct = variant && product ? {
      ...variant,
      product: product
    } : undefined;

    const unitPrice = variant?.final_price || product?.base_price || 0;
    let updatedCart: Cart | null = null;

    setCart((currentCart) => {
      if (!currentCart) {
        const newItem: CartItemWithVariant = {
          id: Date.now(),
          cart_id: Date.now(),
          variant_id: data.variant_id,
          quantity: safeQuantity,
          unit_price: unitPrice,
          total_price: unitPrice * safeQuantity,
          added_at: now,
          updated_at: now,
          variant: variantWithProduct,
        };

        updatedCart = {
          id: Date.now(),
          status: CartStatus.ACTIVE,
          total_amount: unitPrice * safeQuantity,
          item_count: safeQuantity,
          currency: 'USD',
          items: [newItem],
          created_at: now,
          updated_at: now,
        };
      } else {
        const existingItemIndex = currentCart.items?.findIndex(
          item => item.variant_id === data.variant_id
        );

        let updatedItems: CartItemWithVariant[];

        if (existingItemIndex !== undefined && existingItemIndex >= 0 && currentCart.items) {
          updatedItems = [...currentCart.items] as CartItemWithVariant[];
          const existingItem = updatedItems[existingItemIndex];
        const newQuantity = existingItem.quantity + safeQuantity;
        updatedItems[existingItemIndex] = {
          ...existingItem,
          quantity: newQuantity,
          total_price: unitPrice * newQuantity,
          updated_at: now,
        };
      } else {
        const newItem: CartItemWithVariant = {
          id: Date.now(),
          cart_id: currentCart.id,
          variant_id: data.variant_id,
          quantity: safeQuantity,
          unit_price: unitPrice,
          total_price: unitPrice * safeQuantity,
          added_at: now,
          updated_at: now,
          variant: variantWithProduct,
        };
          updatedItems = [...(currentCart.items || []), newItem] as CartItemWithVariant[];
        }

        const totalAmount = updatedItems.reduce((sum, item) => sum + item.total_price, 0);

        updatedCart = {
          ...currentCart,
          items: updatedItems,
          item_count: calculateItemCount({ ...currentCart, items: updatedItems }),
          total_amount: totalAmount,
          updated_at: now,
        };
      }

      setItemCount(calculateItemCount(updatedCart));
      persistCart(updatedCart);
      return updatedCart;
    });

    if (!updatedCart) {
      throw new Error('Failed to update cart');
    }

    if (!isAuthenticated) {
      return updatedCart;
    }

    try {
      await cartApi.addToCart({
        variant_id: data.variant_id,
        quantity: safeQuantity,
      });
      const synced = await syncWithAPI();
      return synced ?? updatedCart;
    } catch (error) {
      console.error('Failed to sync addToCart with API:', error);
      return updatedCart;
    }
  }, [isAuthenticated, syncWithAPI]);

  const updateQuantity = useCallback(async (itemId: number, data: UpdateCartItemDto): Promise<Cart> => {
    let updatedCart: Cart | null = null;
    
    setCart((currentCart) => {
      if (!currentCart || !currentCart.items) {
        throw new Error('Cart is empty');
      }

      const now = new Date();
      const itemIndex = currentCart.items.findIndex(item => item.id === itemId);

      if (itemIndex === -1) {
        throw new Error('Item not found in cart');
      }

      const updatedItems = [...currentCart.items];
      const item = updatedItems[itemIndex];

      updatedItems[itemIndex] = {
        ...item,
        quantity: data.quantity,
        total_price: item.unit_price * data.quantity,
        updated_at: now,
      };

      updatedCart = {
        ...currentCart,
        items: updatedItems,
        item_count: calculateItemCount({ ...currentCart, items: updatedItems }),
        updated_at: now,
      };

      setItemCount(calculateItemCount(updatedCart));
      persistCart(updatedCart);
      return updatedCart;
    });

    if (!updatedCart) {
      throw new Error('Failed to update cart');
    }

    if (!isAuthenticated) {
      return updatedCart;
    }

    try {
      await cartApi.updateCartItem(itemId, data);
      const synced = await syncWithAPI();
      return synced ?? updatedCart;
    } catch (error) {
      console.error('Failed to sync updateQuantity with API:', error);
      return updatedCart;
    }
  }, [isAuthenticated, syncWithAPI]);

  const removeItem = useCallback(async (itemId: number): Promise<Cart> => {
    let updatedCart: Cart | null = null;
    
    setCart((currentCart) => {
      if (!currentCart || !currentCart.items) {
        throw new Error('Cart is empty');
      }

      const now = new Date();
      const updatedItems = currentCart.items.filter(item => item.id !== itemId);

      updatedCart = {
        ...currentCart,
        items: updatedItems,
        item_count: calculateItemCount({ ...currentCart, items: updatedItems }),
        updated_at: now,
      };

      setItemCount(calculateItemCount(updatedCart));
      persistCart(updatedCart);
      return updatedCart;
    });

    if (!updatedCart) {
      throw new Error('Failed to update cart');
    }

    if (!isAuthenticated) {
      return updatedCart;
    }

    try {
      await cartApi.removeCartItem(itemId);
      const synced = await syncWithAPI();
      return synced ?? updatedCart;
    } catch (error) {
      console.error('Failed to sync removeItem with API:', error);
      // Re-throw the error so Promise.allSettled can catch it as rejected
      throw error;
    }
  }, [isAuthenticated, syncWithAPI]);

  const clearCart = useCallback(async (): Promise<void> => {
    setCart(null);
    setItemCount(0);
    persistCart(null);

    if (!isAuthenticated) {
      return;
    }

    try {
      await cartApi.clearCart();
    } catch (error) {
      console.error('Failed to clear cart on API:', error);
    }
  }, [isAuthenticated]);

  const refreshCart = useCallback(async (): Promise<Cart | null> => {
    if (isAuthenticated) {
      return await syncWithAPI();
    }
    let currentCart: Cart | null = null;
    setCart((c) => {
      currentCart = c;
      return c;
    });
    return currentCart;
  }, [isAuthenticated, syncWithAPI]);

  const mergeLocalCartToServer = useCallback(async () => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (!stored) {
        return;
      }
      const localCart: Cart = JSON.parse(stored);
      if (!localCart.items || localCart.items.length === 0) {
        return;
      }

      setIsLoading(true);
      for (const item of localCart.items) {
        // Skip items without valid variant_id to prevent 400 errors
        if (!item.variant_id || item.variant_id <= 0) {
          console.warn('Skipping cart item with invalid variant_id:', item);
          continue;
        }
        await cartApi.addToCart({ variant_id: item.variant_id, quantity: item.quantity });
      }
      localStorage.removeItem(CART_STORAGE_KEY);
    } catch (error) {
      console.error('Failed to merge local cart with API:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthLoading) {
      return;
    }

    const didLogout = wasAuthenticated.current === true && !isAuthenticated;
    
    wasAuthenticated.current = isAuthenticated;

    if (!isAuthenticated) {
      if (didLogout) {
        clearLocalCart();
        try {
          localStorage.removeItem(CART_USER_KEY);
        } catch (error) {
          console.error('Failed to clear cart user key from localStorage:', error);
        }
      } else {
        loadCartFromStorage();
      }
      return;
    }

    const syncAuthenticatedCart = async () => {
      if (user?.id) {
        try {
          const storedUserId = localStorage.getItem(CART_USER_KEY);
          if (storedUserId && storedUserId !== String(user.id)) {
            clearLocalCart();
          }
          localStorage.setItem(CART_USER_KEY, String(user.id));
        } catch (error) {
          console.error('Failed to sync cart user key in localStorage:', error);
        }
      }
      await mergeLocalCartToServer();
      await syncWithAPI();
    };

    void syncAuthenticatedCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isAuthLoading]);

  const value: CartContextType = {
    cart,
    isLoading,
    itemCount,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart,
    refreshCart,
    syncWithAPI,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
