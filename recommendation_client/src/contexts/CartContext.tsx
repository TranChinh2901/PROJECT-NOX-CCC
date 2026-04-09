'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { CartContextType, Cart, AddToCartDto, UpdateCartItemDto, CartItem, Product, ProductVariant, CartItemVariant } from '@/types';
import { CartStatus } from '@/types/order.types';
import { cartApi, productApi } from '@/lib/api';
import { recommendationApi } from '@/lib/api/recommendation.api';
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
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin') ?? false;
  const { isAuthenticated, isLoading: isAuthLoading, user } = useAuth();
  const prevUserId = useRef<number | null>(null);

  const calculateItemCount = useCallback((cartData: Cart | null): number => {
    if (!cartData?.items) return 0;
    return cartData.items.reduce((sum, item) => sum + item.quantity, 0);
  }, []);

  const persistCart = useCallback((cartData: Cart | null) => {
    try {
      if (cartData) {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartData));
      } else {
        localStorage.removeItem(CART_STORAGE_KEY);
      }
    } catch (error) {
      console.error('Failed to persist cart to localStorage:', error);
    }
  }, []);

  const clearLocalCartStorage = useCallback(() => {
    try {
      localStorage.removeItem(CART_STORAGE_KEY);
      localStorage.removeItem(CART_USER_KEY);
    } catch (error) {
      console.error('Failed to clear cart from localStorage:', error);
    }
  }, []);

  const loadCartFromStorage = useCallback(async () => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        const parsedCart: Cart = JSON.parse(stored);
        
        const enrichedItems = await Promise.all(
          (parsedCart.items || []).map(async (item) => {
            const variant = item.variant;
            const productId = variant?.product_id;
            
            if (productId && (!variant?.product || !variant.product.base_price)) {
              try {
                const product = await productApi.getProductById(productId);
                const variantFromProduct = product?.variants?.find((v) => v.id === item.variant_id);
                const enrichedVariant = variantFromProduct ?? variant;
                
                return {
                  ...item,
                  variant: enrichedVariant ? { ...enrichedVariant, product } : variant,
                  unit_price: enrichedVariant?.final_price ?? product?.base_price ?? item.unit_price ?? 0,
                };
              } catch (error) {
                console.error('Failed to enrich cart item from storage:', error);
                return item;
              }
            }
            
            return item;
          })
        );
        
        const enrichedCart = {
          ...parsedCart,
          items: enrichedItems,
        };
        
        setCart(enrichedCart);
        setItemCount(calculateItemCount(enrichedCart));
        persistCart(enrichedCart);
      } else {
        setCart(null);
        setItemCount(0);
      }
    } catch (error) {
      console.error('Failed to load cart from localStorage:', error);
      setCart(null);
      setItemCount(0);
    }
  }, [calculateItemCount, persistCart]);
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

          return { ...item, variant: variantWithProduct };
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
  }, [calculateItemCount, persistCart, loadCartFromStorage]);

  const mergeLocalCartToServer = useCallback(async (): Promise<void> => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (!stored) return;

      const localCart: Cart = JSON.parse(stored);
      if (!localCart.items?.length) {
        localStorage.removeItem(CART_STORAGE_KEY);
        return;
      }

      setIsLoading(true);
      const validItems = localCart.items.filter(item => item.variant_id && item.variant_id > 0);

      if (validItems.length === 0) {
        localStorage.removeItem(CART_STORAGE_KEY);
        return;
      }

      await Promise.all(
        validItems.map(item =>
          cartApi.addToCart({ variant_id: item.variant_id, quantity: item.quantity })
        )
      );

      localStorage.removeItem(CART_STORAGE_KEY);
    } catch (error) {
      console.error('Failed to merge local cart with API:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addToCart = useCallback(async (data: AddToCartDto, product?: Product, variant?: ProductVariant): Promise<Cart> => {
    const safeQuantity = data.quantity && data.quantity > 0 ? data.quantity : 1;
    const now = new Date();

    const unitPrice = variant?.final_price ?? product?.base_price ?? 0;
    let updatedCart: Cart | null = null;
    const buildUpdatedCart = (currentCart: Cart | null): Cart => {
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
          variant: variant && product ? { ...variant, product } : undefined,
        };

        return {
          id: Date.now(),
          status: CartStatus.ACTIVE,
          total_amount: unitPrice * safeQuantity,
          item_count: safeQuantity,
          currency: 'USD',
          items: [newItem],
          created_at: now,
          updated_at: now,
        };
      }

      const existingIndex = currentCart.items?.findIndex(item => item.variant_id === data.variant_id);
      const nowInner = now;

      if (existingIndex !== undefined && existingIndex >= 0 && currentCart.items) {
        const updatedItems = [...currentCart.items] as CartItemWithVariant[];
        const existingItem = updatedItems[existingIndex];
        const newQuantity = existingItem.quantity + safeQuantity;
        updatedItems[existingIndex] = {
          ...existingItem,
          quantity: newQuantity,
          total_price: unitPrice * newQuantity,
          updated_at: nowInner,
        };
        return {
          ...currentCart,
          items: updatedItems,
          item_count: calculateItemCount({ ...currentCart, items: updatedItems }),
          total_amount: updatedItems.reduce((sum, item) => sum + item.total_price, 0),
          updated_at: nowInner,
        };
      }

      const newItem: CartItemWithVariant = {
        id: Date.now(),
        cart_id: currentCart.id,
        variant_id: data.variant_id,
        quantity: safeQuantity,
        unit_price: unitPrice,
        total_price: unitPrice * safeQuantity,
        added_at: now,
        updated_at: now,
        variant: variant && product ? { ...variant, product } : undefined,
      };
      const nextItems = [...(currentCart.items || []), newItem];

      return {
        ...currentCart,
        items: nextItems,
        item_count: calculateItemCount({ ...currentCart, items: nextItems }),
        total_amount: nextItems.reduce((sum, item) => sum + item.total_price, 0),
        updated_at: now,
      };
    };

    setCart((currentCart) => {
      updatedCart = buildUpdatedCart(currentCart);

      setItemCount(calculateItemCount(updatedCart));
      persistCart(updatedCart);
      return updatedCart;
    });

    if (!updatedCart) {
      updatedCart = buildUpdatedCart(cart);
      setCart(updatedCart);
      setItemCount(calculateItemCount(updatedCart));
      persistCart(updatedCart);
    }

    if (!isAuthenticated) return updatedCart;

    try {
      await cartApi.addToCart({ variant_id: data.variant_id, quantity: safeQuantity });
      const synced = await syncWithAPI();

      if (user?.id) {
        recommendationApi.trackBehavior({
          userId: user.id,
          behaviorType: 'add_to_cart',
          productId: product?.id ?? variant?.product_id,
          categoryId: product?.category?.id,
          metadata: {
            source: 'cart_context',
            variantId: data.variant_id,
            quantity: safeQuantity,
          },
        }).catch((error: unknown) => {
          console.error('Failed to track add to cart:', error);
        });
      }

      return synced ?? updatedCart;
    } catch (error) {
      console.error('Failed to sync addToCart with API:', error);
      return updatedCart;
    }
  }, [cart, isAuthenticated, syncWithAPI, calculateItemCount, persistCart, user?.id]);
  const updateQuantity = useCallback(async (itemId: number, data: UpdateCartItemDto): Promise<Cart> => {
    let updatedCart: Cart | null = null;
    const now = new Date();

    setCart((currentCart) => {
      if (!currentCart?.items) throw new Error('Cart is empty');

      const itemIndex = currentCart.items.findIndex(item => item.id === itemId);
      if (itemIndex === -1) throw new Error('Item not found in cart');

      const updatedItems = [...currentCart.items];
      updatedItems[itemIndex] = {
        ...updatedItems[itemIndex],
        quantity: data.quantity,
        total_price: updatedItems[itemIndex].unit_price * data.quantity,
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

    if (!updatedCart) throw new Error('Failed to update cart');

    if (!isAuthenticated) return updatedCart;

    try {
      await cartApi.updateCartItem(itemId, data);
      const synced = await syncWithAPI();
      return synced ?? updatedCart;
    } catch (error) {
      console.error('Failed to sync updateQuantity with API:', error);
      return updatedCart;
    }
  }, [isAuthenticated, syncWithAPI, calculateItemCount, persistCart]);
  const removeItem = useCallback(async (itemId: number): Promise<Cart> => {
    let updatedCart: Cart | null = null;
    const now = new Date();

    setCart((currentCart) => {
      if (!currentCart?.items) throw new Error('Cart is empty');

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

    if (!updatedCart) throw new Error('Failed to update cart');

    if (!isAuthenticated) return updatedCart;

    try {
      await cartApi.removeCartItem(itemId);
      const synced = await syncWithAPI();
      return synced ?? updatedCart;
    } catch (error) {
      const axiosError = error as { response?: { status?: number } };
      if (axiosError.response?.status === 403) {
        console.warn('Cart is locked (possibly converted to order), clearing local state');
        setCart(null);
        setItemCount(0);
        clearLocalCartStorage();
        persistCart(null);
        throw new Error('Cart has been processed. Please refresh to continue.');
      }
      console.error('Failed to sync removeItem with API:', error);
      return updatedCart;
    }
  }, [isAuthenticated, syncWithAPI, calculateItemCount, persistCart, clearLocalCartStorage]);
  const bulkRemoveItems = useCallback(async (itemIds: number[]): Promise<Cart> => {
    let updatedCart: Cart | null = null;
    const now = new Date();

    setCart((currentCart) => {
      if (!currentCart?.items) throw new Error('Cart is empty');

      const itemIdsSet = new Set(itemIds);
      const updatedItems = currentCart.items.filter(item => !itemIdsSet.has(item.id));
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

    if (!updatedCart) throw new Error('Failed to update cart');

    if (!isAuthenticated) return updatedCart;

    try {
      const result = await cartApi.bulkRemoveItems(itemIds);
      setCart(result);
      setItemCount(calculateItemCount(result));
      persistCart(result);
      return result;
    } catch (error) {
      console.error('Failed to bulk remove items from API:', error);
      return updatedCart;
    }
  }, [isAuthenticated, calculateItemCount, persistCart]);

  const clearCart = useCallback(async (): Promise<void> => {
    setCart(null);
    setItemCount(0);
    clearLocalCartStorage();
    persistCart(null);

    skipNextSync.current = true;

    if (!isAuthenticated) return;

    try {
      await cartApi.clearCart();
    } catch (error) {
      console.warn('Failed to clear cart on API, but local cart is cleared:', error);
    }
  }, [isAuthenticated, clearLocalCartStorage, persistCart]);

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

  const skipNextSync = useRef(false);

  useEffect(() => {
    if (isAdminRoute) {
      setCart(null);
      setItemCount(0);
      setIsLoading(false);
      prevUserId.current = user?.id ?? null;
      return;
    }

    if (isAuthLoading) return;

    const currentUserId = user?.id ?? null;
    const prevUser = prevUserId.current;
    const didLogout = prevUser !== null && !isAuthenticated;
    const didSwitchUser = prevUser !== null && currentUserId !== null && prevUser !== currentUserId;

    prevUserId.current = currentUserId;

    if (didLogout || didSwitchUser) {
      clearLocalCartStorage();
      setCart(null);
      setItemCount(0);
    }

    if (!isAuthenticated) {
      if (didLogout) {
        try {
          localStorage.removeItem(CART_USER_KEY);
        } catch (error) {
          console.error('Failed to clear cart user key from localStorage:', error);
        }
      } else if (!didSwitchUser) {
        loadCartFromStorage();
      }
      return;
    }

    const syncCart = async () => {
      if (!user?.id) return;

      try {
        if (skipNextSync.current) {
          skipNextSync.current = false;
          await syncWithAPI();
          return;
        }

        const storedUserId = localStorage.getItem(CART_USER_KEY);
        if (storedUserId && storedUserId !== String(user.id)) {
          clearLocalCartStorage();
        }
        localStorage.setItem(CART_USER_KEY, String(user.id));
        await mergeLocalCartToServer();
        await syncWithAPI();
      } catch (error) {
        console.error('Failed to sync cart for authenticated user:', error);
      }
    };

    void syncCart();
  }, [isAdminRoute, isAuthenticated, isAuthLoading, user?.id, loadCartFromStorage, clearLocalCartStorage, mergeLocalCartToServer, syncWithAPI]);

  const value: CartContextType = {
    cart,
    isLoading,
    itemCount,
    addToCart,
    updateQuantity,
    removeItem,
    bulkRemoveItems,
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
