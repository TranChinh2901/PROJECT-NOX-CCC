'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { AuthContextType, User, LoginDto, SignupDto, UpdateProfileDto, AuthResponse } from '@/types';
import { authApi } from '@/lib/api';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // TODO: Implement auth methods
  const login = useCallback(async (credentials: LoginDto): Promise<AuthResponse> => {
    throw new Error('Not implemented');
  }, []);

  const signup = useCallback(async (userData: SignupDto): Promise<AuthResponse> => {
    throw new Error('Not implemented');
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    throw new Error('Not implemented');
  }, []);

  const refreshToken = useCallback(async (refreshToken: string) => {
    throw new Error('Not implemented');
  }, []);

  const getProfile = useCallback(async (): Promise<User> => {
    throw new Error('Not implemented');
  }, []);

  const updateProfile = useCallback(async (data: UpdateProfileDto): Promise<User> => {
    throw new Error('Not implemented');
  }, []);

  const uploadAvatar = useCallback(async (file: File) => {
    throw new Error('Not implemented');
  }, []);

  const getAllUsers = useCallback(async (params?: { sort?: string; limit?: number }) => {
    throw new Error('Not implemented');
  }, []);

  const deleteAccount = useCallback(async (userId: number) => {
    throw new Error('Not implemented');
  }, []);

  const deleteUserById = useCallback(async (userId: number) => {
    throw new Error('Not implemented');
  }, []);

  const updateUserById = useCallback(async (userId: number, data: Partial<User>) => {
    throw new Error('Not implemented');
  }, []);

  // Alias for API parity
  const register = signup;

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    signup,
    register,
    logout,
    refreshToken,
    getProfile,
    updateProfile,
    uploadAvatar,
    getAllUsers,
    deleteAccount,
    deleteUserById,
    updateUserById,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
