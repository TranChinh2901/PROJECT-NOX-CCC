import { GenderType } from "@/modules/users/enum/user.enum";
import { RoleType } from "../enum/auth.enum";
export interface UpdateProfileDto {
  fullname?: string;
  phone_number?: string;
  address?: string;
  gender?: GenderType;
  date_of_birth?: Date;
  avatar?: string;
}

export interface UserListResponseDto {
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

export interface GetAllUsersResponseDto {
  users: UserListResponseDto[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  
 }
}