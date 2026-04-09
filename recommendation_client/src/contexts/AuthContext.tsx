'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { AuthContextType, User, LoginDto, SignupDto, UpdateProfileDto, AuthResponse, ChangePasswordDto, ChangePasswordResponse } from '@/types';
import { authApi } from '@/lib/api';

const AuthContext = createContext<AuthContextType | undefined>(undefined);
export const AUTH_USER_UPDATED_EVENT = 'technova:user-updated';

const STORAGE_KEYS = {
  accessToken: 'technova_access_token',
  refreshToken: 'technova_refresh_token',
  user: 'technova_user',
  legacyAccessToken: 'accessToken',
  legacyRefreshToken: 'refreshToken',
  legacyUser: 'user',
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const storeAuthState = useCallback((authResponse: AuthResponse) => {
    setUser(authResponse.user);
    setIsAuthenticated(Boolean(authResponse.accessToken));
    if (typeof window === 'undefined') {
      return;
    }
    const serializedUser = JSON.stringify(authResponse.user);
    localStorage.setItem(STORAGE_KEYS.accessToken, authResponse.accessToken);
    localStorage.setItem(STORAGE_KEYS.refreshToken, authResponse.refreshToken);
    localStorage.setItem(STORAGE_KEYS.user, serializedUser);
    localStorage.setItem(STORAGE_KEYS.legacyAccessToken, authResponse.accessToken);
    localStorage.setItem(STORAGE_KEYS.legacyRefreshToken, authResponse.refreshToken);
    localStorage.setItem(STORAGE_KEYS.legacyUser, serializedUser);
  }, []);

  const storeAccessToken = useCallback((accessToken: string) => {
    setIsAuthenticated(Boolean(accessToken));
    if (typeof window === 'undefined') {
      return;
    }
    localStorage.setItem(STORAGE_KEYS.accessToken, accessToken);
    localStorage.setItem(STORAGE_KEYS.legacyAccessToken, accessToken);
  }, []);

  const storeUser = useCallback((nextUser: User) => {
    setUser(nextUser);
    if (typeof window === 'undefined') {
      return;
    }
    const serializedUser = JSON.stringify(nextUser);
    localStorage.setItem(STORAGE_KEYS.user, serializedUser);
    localStorage.setItem(STORAGE_KEYS.legacyUser, serializedUser);
  }, []);

  const clearStoredAuth = useCallback(() => {
    setUser(null);
    setIsAuthenticated(false);
    if (typeof window === 'undefined') {
      return;
    }
    localStorage.removeItem(STORAGE_KEYS.accessToken);
    localStorage.removeItem(STORAGE_KEYS.refreshToken);
    localStorage.removeItem(STORAGE_KEYS.user);
    localStorage.removeItem(STORAGE_KEYS.legacyAccessToken);
    localStorage.removeItem(STORAGE_KEYS.legacyRefreshToken);
    localStorage.removeItem(STORAGE_KEYS.legacyUser);
    localStorage.removeItem('cart:state');
    localStorage.removeItem('cart:user_id');
  }, []);

  const login = useCallback(
    async (credentials: LoginDto): Promise<AuthResponse> => {
      const response = await authApi.login(credentials);
      storeAuthState(response);
      return response;
    },
    [storeAuthState]
  );

  const signup = useCallback(
    async (userData: SignupDto): Promise<AuthResponse> => {
      const response = await authApi.register(userData);
      return response;
    },
    []
  );

  const logout = useCallback(
    async (): Promise<void> => {
      try {
        await authApi.logout();
      } finally {
        clearStoredAuth();
      }
    },
    [clearStoredAuth]
  );

  const refreshToken = useCallback(
    async (refreshTokenValue: string) => {
      const response = await authApi.refreshToken(refreshTokenValue);
      storeAccessToken(response.accessToken);
      return response;
    },
    [storeAccessToken]
  );

  const getProfile = useCallback(async (): Promise<User> => {
    const profile = await authApi.getProfile();
    storeUser(profile);
    return profile;
  }, [storeUser]);

  const updateProfile = useCallback(
    async (data: UpdateProfileDto): Promise<User> => {
      const updatedProfile = await authApi.updateProfile(data);
      storeUser(updatedProfile);
      return updatedProfile;
    },
    [storeUser]
  );

  const changePassword = useCallback(
    async (data: ChangePasswordDto): Promise<ChangePasswordResponse> => {
      return await authApi.changePassword(data);
    },
    []
  );

  const uploadAvatar = useCallback(async (file: File) => {
    return await authApi.uploadAvatar(file);
  }, []);

  const getAllUsers = useCallback(async (params?: { sort?: string; limit?: number }) => {
    return await authApi.getAllUsers(params);
  }, []);

  const deleteAccount = useCallback(async (userId: number) => {
    await authApi.deleteAccount(userId);
  }, []);

  const deleteUserById = useCallback(async (userId: number) => {
    await authApi.deleteUserById(userId);
  }, []);

  const updateUserById = useCallback(async (userId: number, data: Partial<User>) => {
    return await authApi.updateUserById(userId, data);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      setIsLoading(false);
      return;
    }

    const storedAccessToken =
      localStorage.getItem(STORAGE_KEYS.accessToken) ??
      localStorage.getItem(STORAGE_KEYS.legacyAccessToken);
    const storedUser =
      localStorage.getItem(STORAGE_KEYS.user) ?? localStorage.getItem(STORAGE_KEYS.legacyUser);

    if (!storedAccessToken) {
      setUser(null);
      localStorage.removeItem(STORAGE_KEYS.user);
      localStorage.removeItem(STORAGE_KEYS.legacyUser);
      setIsAuthenticated(false);
      setIsLoading(false);
      return;
    }

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser) as User);
      } catch {
        localStorage.removeItem(STORAGE_KEYS.user);
        localStorage.removeItem(STORAGE_KEYS.legacyUser);
      }
    }

    setIsAuthenticated(Boolean(storedAccessToken));
    setIsLoading(false);

    const syncUserFromStorage = () => {
      const latestStoredUser =
        localStorage.getItem(STORAGE_KEYS.user) ?? localStorage.getItem(STORAGE_KEYS.legacyUser);

      if (!latestStoredUser) {
        setUser(null);
        return;
      }

      try {
        setUser(JSON.parse(latestStoredUser) as User);
      } catch {
        localStorage.removeItem(STORAGE_KEYS.user);
        localStorage.removeItem(STORAGE_KEYS.legacyUser);
      }
    };

    const handleStorage = (event: StorageEvent) => {
      if (
        event.key === STORAGE_KEYS.user ||
        event.key === STORAGE_KEYS.legacyUser
      ) {
        syncUserFromStorage();
      }
    };

    const handleUserUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<User | undefined>;
      if (customEvent.detail) {
        storeUser(customEvent.detail);
        return;
      }

      syncUserFromStorage();
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener(AUTH_USER_UPDATED_EVENT, handleUserUpdated as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(AUTH_USER_UPDATED_EVENT, handleUserUpdated as EventListener);
    };
  }, [storeUser]);

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
    changePassword,
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
