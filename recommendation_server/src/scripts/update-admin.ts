import 'reflect-metadata';
import { AppDataSource } from '@/config/database.config';
import { User } from '@/modules/users/entity/user.entity';
import { RoleType } from '@/modules/auth/enum/auth.enum';

async function updateUserRole() {
  try {
    await AppDataSource.initialize();
    console.log('Database connected');

    // Update admin2@test.com to ADMIN role
    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({ where: { email: 'admin2@test.com' } });

    if (user) {
      user.role = RoleType.ADMIN;
      await userRepo.save(user);
      console.log('User role updated successfully!');
      console.log(`User: ${user.email}`);
      console.log(`New role: ${user.role}`);
    } else {
      console.log('User not found');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

updateUserRole();