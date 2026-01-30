// Enums shared across auth domain
export enum GenderType {
  MALE = 'male',
  FEMALE = 'female'
}

export enum RoleType {
  ADMIN = 'ADMIN',
  USER = 'USER'
}

// User types
export interface User {
  id: number;
  fullname: string;
  email: string;
  phone_number: string;
  address?: string;
  avatar?: string;
  gender?: GenderType;
  date_of_birth?: Date;
  is_verified: boolean;
  role: RoleType;
  created_at: Date;
  updated_at: Date;
}

// DTOs for auth operations
export interface LoginDto {
  email: string;
  password: string;
}

export interface SignupDto {
  fullname: string;
  email: string;
  password: string;
  phone_number?: string;
  address?: string;
  gender: GenderType;
  date_of_birth: Date | string;
  role?: RoleType;
}

export interface UpdateProfileDto {
  fullname?: string;
  phone_number?: string;
  address?: string;
  gender?: GenderType;
  date_of_birth?: Date | string;
}

// Auth response types
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface RefreshTokenResponse {
  accessToken: string;
}

/**
 * Auth context contract shared by Cart and Profile teams.
 *
 * Token management strategy:
 * - Store `accessToken` and `refreshToken` (and a serialized `user`) in localStorage.
 * - apiClient's request interceptor reads `accessToken` from localStorage to set the
 *   Authorization header for authenticated requests.
 * - On logout or 401 responses, tokens are removed from localStorage.
 */
export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  signup(userData: SignupDto): Promise<AuthResponse>;

  register(userData: SignupDto): Promise<AuthResponse>;

  login(credentials: LoginDto): Promise<AuthResponse>;

  logout(): Promise<void>;

  refreshToken(refreshToken: string): Promise<RefreshTokenResponse>;

  getProfile(): Promise<User>;

  updateProfile(data: UpdateProfileDto): Promise<User>;

  uploadAvatar(file: File): Promise<{ avatarUrl: string }>;

  getAllUsers(params?: { sort?: string; limit?: number }): Promise<User[]>;

  deleteAccount(userId: number): Promise<void>;

  deleteUserById(userId: number): Promise<void>;

  updateUserById(userId: number, data: Partial<User>): Promise<User>;
}
