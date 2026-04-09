import { RoleType } from "@/modules/auth/enum/auth.enum";

export interface UpdateUserDto {
  fullname?: string;
  email?: string;
  phone_number?: string;
  avatar?: string | null;
  role?: RoleType;
}

export interface BulkDeactivateDto {
  ids: number[];
}
