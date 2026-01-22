import 'reflect-metadata';
import { AppDataSource } from '@/config/database.config';
import { User } from '@/modules/users/entity/user.entity';
import { hash } from 'bcryptjs';
import { RoleType } from '@/modules/auth/enum/auth.enum';
import { GenderType } from '@/modules/users/enum/user.enum';

async function createAdmin() {
  try {
    await AppDataSource.initialize();
    console.log('Database connected');

    // Delete existing admin
    await AppDataSource.getRepository(User).delete({ email: 'admin@ndstyle.com' });
    console.log('Deleted existing admin user');

    // Create new admin
    const admin = AppDataSource.getRepository(User).create({
      fullname: 'Admin User',
      email: 'admin@ndstyle.com',
      phone_number: '0987654321',
      password: await hash('admin123', 10),
      role: RoleType.ADMIN,
      is_verified: true,
      gender: GenderType.MALE,
      address: 'Admin Address'
    });

    await AppDataSource.getRepository(User).save(admin);
    console.log('Admin user created successfully!');
    console.log('Email: admin@ndstyle.com');
    console.log('Password: admin123');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createAdmin();
