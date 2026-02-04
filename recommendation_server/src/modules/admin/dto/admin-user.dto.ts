import { RoleType } from "@/modules/auth/enum/auth.enum";

export interface UpdateUserDto {
  fullname?: string;
  email?: string;
  role?: RoleType;
}

export interface BulkDeactivateDto {
  ids: number[];
}
