import bcryptjs from 'bcryptjs';
import { User } from '@/modules/users/entity/user.entity';
import { RoleType } from '@/modules/auth/enum/auth.enum';
import { GenderType } from '@/modules/users/enum/user.enum';

const ADMIN_PASSWORD_HASH = bcryptjs.hashSync('admin123', 10);
const USER_PASSWORD_HASH = bcryptjs.hashSync('user123', 10);

export const ADMIN_USER: User = {
  id: 1,
  fullname: 'Admin User',
  email: 'admin@example.com',
  phone_number: '0901234567',
  address: '123 Admin Street, Ho Chi Minh City',
  avatar: 'https://i.pravatar.cc/150?img=1',
  password: ADMIN_PASSWORD_HASH,
  gender: GenderType.MALE,
  date_of_birth: new Date('1990-01-15'),
  is_verified: true,
  role: RoleType.ADMIN,
  created_at: new Date('2024-01-01T08:00:00Z'),
  updated_at: new Date('2024-01-01T08:00:00Z'),
} as User;

export const USER_1: User = {
  id: 2,
  fullname: 'John Doe',
  email: 'john.doe@example.com',
  phone_number: '0902234567',
  address: '456 User Street, Ha Noi',
  avatar: 'https://i.pravatar.cc/150?img=2',
  password: USER_PASSWORD_HASH,
  gender: GenderType.MALE,
  date_of_birth: new Date('1995-05-20'),
  is_verified: true,
  role: RoleType.USER,
  created_at: new Date('2024-01-05T10:30:00Z'),
  updated_at: new Date('2024-01-05T10:30:00Z'),
} as User;

export const USER_2: User = {
  id: 3,
  fullname: 'Jane Smith',
  email: 'jane.smith@example.com',
  phone_number: '0903234567',
  address: '789 Customer Road, Da Nang',
  avatar: 'https://i.pravatar.cc/150?img=3',
  password: USER_PASSWORD_HASH,
  gender: GenderType.FEMALE,
  date_of_birth: new Date('1998-08-10'),
  is_verified: false,
  role: RoleType.USER,
  created_at: new Date('2024-01-10T14:15:00Z'),
  updated_at: new Date('2024-01-10T14:15:00Z'),
} as User;

export const TEST_USERS = [ADMIN_USER, USER_1, USER_2];
