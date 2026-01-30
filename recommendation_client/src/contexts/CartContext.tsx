'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CartContextType, Cart, AddToCartDto, UpdateCartItemDto, CartItem } from '@/types';
import { CartStatus } from '@/types/order.types';

const CART_STORAGE_KEY = 'cart:state';

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [itemCount, setItemCount] = useState(0);

  const calculateItemCount = (cartData: Cart | null): number => {
    if (!cartData || !cartData.items) {
      return 0;
    }
    return cartData.items.reduce((sum, item) => sum + item.quantity, 0);
  };

  useEffect(() => {
    const loadCart = () => {
      try {
        const stored = localStorage.getItem(CART_STORAGE_KEY);
        if (stored) {
          const parsedCart: Cart = JSON.parse(stored);
          setCart(parsedCart);
          setItemCount(calculateItemCount(parsedCart));
        }
      } catch (error) {
        console.error('Failed to load cart from localStorage:', error);
      }
    };

    loadCart();
  }, []);

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

  const addToCart = useCallback(async (data: AddToCartDto): Promise<Cart> => {
    const now = new Date();
    let updatedCart: Cart;

    if (!cart) {
      const newItem: CartItem = {
        id: Date.now(),
        cart_id: Date.now(),
        variant_id: data.variant_id,
        quantity: data.quantity,
        unit_price: 0,
        total_price: 0,
        added_at: now,
        updated_at: now,
      };

      updatedCart = {
        id: Date.now(),
        status: CartStatus.ACTIVE,
        total_amount: 0,
        item_count: data.quantity,
        currency: 'USD',
        items: [newItem],
        created_at: now,
        updated_at: now,
      };
    } else {
      const existingItemIndex = cart.items?.findIndex(
        item => item.variant_id === data.variant_id
      );

      let updatedItems: CartItem[];

      if (existingItemIndex !== undefined && existingItemIndex >= 0 && cart.items) {
        updatedItems = [...cart.items];
        const existingItem = updatedItems[existingItemIndex];
        updatedItems[existingItemIndex] = {
          ...existingItem,
          quantity: existingItem.quantity + data.quantity,
          total_price: existingItem.unit_price * (existingItem.quantity + data.quantity),
          updated_at: now,
        };
      } else {
        const newItem: CartItem = {
          id: Date.now(),
          cart_id: cart.id,
          variant_id: data.variant_id,
          quantity: data.quantity,
          unit_price: 0,
          total_price: 0,
          added_at: now,
          updated_at: now,
        };
        updatedItems = [...(cart.items || []), newItem];
      }

      updatedCart = {
        ...cart,
        items: updatedItems,
        item_count: calculateItemCount({ ...cart, items: updatedItems }),
        updated_at: now,
      };
    }

    setCart(updatedCart);
    setItemCount(calculateItemCount(updatedCart));
    persistCart(updatedCart);

    return updatedCart;
  }, [cart]);

  const updateQuantity = useCallback(async (itemId: number, data: UpdateCartItemDto): Promise<Cart> => {
    if (!cart || !cart.items) {
      throw new Error('Cart is empty');
    }

    const now = new Date();
    const itemIndex = cart.items.findIndex(item => item.id === itemId);

    if (itemIndex === -1) {
      throw new Error('Item not found in cart');
    }

    const updatedItems = [...cart.items];
    const item = updatedItems[itemIndex];

    updatedItems[itemIndex] = {
      ...item,
      quantity: data.quantity,
      total_price: item.unit_price * data.quantity,
      updated_at: now,
    };

    const updatedCart: Cart = {
      ...cart,
      items: updatedItems,
      item_count: calculateItemCount({ ...cart, items: updatedItems }),
      updated_at: now,
    };

    setCart(updatedCart);
    setItemCount(calculateItemCount(updatedCart));
    persistCart(updatedCart);

    return updatedCart;
  }, [cart]);

  const removeItem = useCallback(async (itemId: number): Promise<Cart> => {
    if (!cart || !cart.items) {
      throw new Error('Cart is empty');
    }

    const now = new Date();
    const updatedItems = cart.items.filter(item => item.id !== itemId);

    const updatedCart: Cart = {
      ...cart,
      items: updatedItems,
      item_count: calculateItemCount({ ...cart, items: updatedItems }),
      updated_at: now,
    };

    setCart(updatedCart);
    setItemCount(calculateItemCount(updatedCart));
    persistCart(updatedCart);

    return updatedCart;
  }, [cart]);

  const clearCart = useCallback(async (): Promise<void> => {
    setCart(null);
    setItemCount(0);
    persistCart(null);
  }, []);

  const refreshCart = useCallback(async (): Promise<Cart | null> => {
    return cart;
  }, [cart]);

  const syncWithAPI = useCallback(async (): Promise<Cart | null> => {
    throw new Error('Not implemented');
  }, []);

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
