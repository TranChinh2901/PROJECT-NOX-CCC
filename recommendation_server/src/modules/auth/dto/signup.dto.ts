import { GenderType } from "@/modules/users/enum/user.enum";

export interface SignupDto {
  fullname: string;
  email: string;
  password: string;
  phone_number: string;
  address?: string;
  gender: GenderType;
  date_of_birth: Date | string;
}
