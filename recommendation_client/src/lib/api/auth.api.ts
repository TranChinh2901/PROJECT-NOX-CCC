import apiClient from './apiClient';
import { 
  LoginDto, 
  SignupDto, 
  UpdateProfileDto,
  AuthResponse,
  RefreshTokenResponse,
  User 
} from '@/types';

export const authApi = {
  async register(userData: SignupDto): Promise<AuthResponse> {
    return await apiClient.post<AuthResponse>('/auth/register', userData);
  },

  async login(credentials: LoginDto): Promise<AuthResponse> {
    return await apiClient.post<AuthResponse>('/auth/login', credentials);
  },

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
  },

  async refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
    return await apiClient.post<RefreshTokenResponse>('/auth/refresh-token', {
      refreshToken
    });
  },

  async getProfile(): Promise<User> {
    return await apiClient.get<User>('/auth/profile');
  },

  async updateProfile(data: UpdateProfileDto): Promise<User> {
    return await apiClient.put<User>('/auth/profile', data);
  },

  async uploadAvatar(file: File): Promise<{ avatarUrl: string }> {
    const formData = new FormData();
    formData.append('avatar', file);
    
    return await apiClient.put<{ avatarUrl: string }>(
      '/auth/upload-avatar',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
  },

  async getAllUsers(params?: { sort?: string; limit?: number }): Promise<User[]> {
    return await apiClient.get<User[]>('/auth/users', { params });
  },

  async deleteAccount(userId: number): Promise<void> {
    await apiClient.delete(`/auth/delete-account/${userId}`);
  },

  async deleteUserById(userId: number): Promise<void> {
    await apiClient.delete(`/auth/users/${userId}`);
  },

  async updateUserById(userId: number, data: Partial<User>): Promise<User> {
    return await apiClient.put<User>(`/auth/users/${userId}`, data);
  },
};
