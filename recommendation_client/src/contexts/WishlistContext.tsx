'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { WishlistCollection, WishlistItem, WishlistContextType, WishlistResponse } from '../types/wishlist.types';
import { useAuth } from './AuthContext';
import { wishlistApi } from '../lib/api/wishlist.api';
import toast from 'react-hot-toast';

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

const isWishlistCollection = (entry: WishlistItem | WishlistCollection): entry is WishlistCollection => {
  return 'items' in entry;
};

const normalizeWishlistItems = (payload: WishlistResponse): WishlistItem[] => {
  if (payload.length === 0) {
    return [];
  }

  const firstEntry = payload[0];
  if (isWishlistCollection(firstEntry)) {
    return (payload as WishlistCollection[]).flatMap((wishlist) => wishlist.items);
  }

  return payload as WishlistItem[];
};

const getVariantId = (item: WishlistItem): number | null => {
  return item.variant_id ?? item.variant?.id ?? null;
};

const getProductId = (item: WishlistItem): number | null => {
  return item.product_id ?? item.variant?.product_id ?? item.product?.id ?? item.variant?.product?.id ?? null;
};

const matchesWishlistItem = (item: WishlistItem, targetId: number): boolean => {
  return getVariantId(item) === targetId || getProductId(item) === targetId;
};

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const wishlistCount = items.length;

  const loadWishlist = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await wishlistApi.getWishlist();
      setItems(normalizeWishlistItems(data));
    } catch (error) {
      console.error('Failed to load wishlist', error);
      // toast.error('Failed to load wishlist');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load initial wishlist
  useEffect(() => {
    if (isAuthenticated) {
      loadWishlist();
    } else {
      setItems([]);
    }
  }, [isAuthenticated, loadWishlist]);

  const isInWishlist = useCallback((productId: number) => {
    return items.some(item => matchesWishlistItem(item, productId));
  }, [items]);

  const addToWishlist = async (productId: number) => {
    if (!isAuthenticated) {
      toast.error('Please login to add items to wishlist');
      return;
    }

    try {
      const newItem = await wishlistApi.addItem(productId);
      setItems(prev => [...prev, newItem]);
      toast.success('Added to wishlist');
    } catch (error) {
      console.error('Failed to add to wishlist', error);
      toast.error('Failed to add to wishlist');
    }
  };

  const removeFromWishlist = async (productId: number) => {
    if (!isAuthenticated) return;

    try {
      const itemToRemove = items.find(item => matchesWishlistItem(item, productId));
      if (!itemToRemove) return;

      setItems(prev => prev.filter(item => item.id !== itemToRemove.id));

      await wishlistApi.removeItem(itemToRemove.id);

      toast.success('Removed from wishlist');
    } catch (error) {
      console.error('Failed to remove from wishlist', error);
      toast.error('Failed to remove from wishlist');
      // Revert on error
      loadWishlist();
    }
  };

  const toggleWishlist = async (productId: number) => {
    if (isInWishlist(productId)) {
      await removeFromWishlist(productId);
    } else {
      await addToWishlist(productId);
    }
  };

  const clearWishlist = async () => {
    setItems([]);
    // API call to clear wishlist if supported, or loop through items and delete
    // For now just clear local state as we don't have a clear endpoint
  };

  return (
    <WishlistContext.Provider value={{
      items,
      isLoading,
      wishlistCount,
      addToWishlist,
      removeFromWishlist,
      isInWishlist,
      toggleWishlist,
      clearWishlist
    }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
