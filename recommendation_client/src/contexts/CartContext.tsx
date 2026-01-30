'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CartContextType, Cart, AddToCartDto, UpdateCartItemDto } from '@/types';

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [itemCount, setItemCount] = useState(0);

  // TODO: Implement cart methods
  const addToCart = useCallback(async (data: AddToCartDto): Promise<Cart> => {
    throw new Error('Not implemented');
  }, []);

  const updateQuantity = useCallback(async (itemId: number, data: UpdateCartItemDto): Promise<Cart> => {
    throw new Error('Not implemented');
  }, []);

  const removeItem = useCallback(async (itemId: number): Promise<Cart> => {
    throw new Error('Not implemented');
  }, []);

  const clearCart = useCallback(async (): Promise<void> => {
    throw new Error('Not implemented');
  }, []);

  const refreshCart = useCallback(async (): Promise<Cart | null> => {
    throw new Error('Not implemented');
  }, []);

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
