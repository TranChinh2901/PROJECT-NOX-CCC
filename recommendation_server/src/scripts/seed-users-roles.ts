

import { AppDataSource } from "@/config/database.config";
import { RoleType } from "@/modules/auth/enum/auth.enum";
import { User } from "@/modules/users/entity/user.entity";
import { GenderType } from "@/modules/users/enum/user.enum";
import * as bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function seedUsersAndRoles() {
  try {
    await AppDataSource.initialize();
    console.log(" Data Source has been initialized!");

    const userRepository = AppDataSource.getRepository(User);

    // Clear existing data
    await userRepository.delete({});
    console.log(" Cleared existing users data");

    // Create test users
    const hashedPassword = await hashPassword("password123");

    const adminUser = userRepository.create({
      fullname: "Admin User",
      email: "admin@example.com",
      phone_number: "0123456789",
      address: "123 Admin Street, Ho Chi Minh City",
      password: hashedPassword,
      gender: GenderType.MALE,
      date_of_birth: new Date("1985-01-15"),
      role: RoleType.ADMIN,
      is_verified: true,
    });

    const normalUser = userRepository.create({
      fullname: "John Doe",
      email: "john@example.com",
      phone_number: "0987654321",
      address: "456 User Street, Ho Chi Minh City",
      password: hashedPassword,
      gender: GenderType.MALE,
      date_of_birth: new Date("1990-06-20"),
      role: RoleType.USER,
      is_verified: true,
    });

    const femaleUser = userRepository.create({
      fullname: "Jane Smith",
      email: "jane@example.com",
      phone_number: "0111222333",
      address: "789 Female Street, Ho Chi Minh City",
      password: hashedPassword,
      gender: GenderType.FEMALE,
      date_of_birth: new Date("1992-03-10"),
      role: RoleType.USER,
      is_verified: false,
    });

    const savedUsers = await userRepository.save([adminUser, normalUser, femaleUser]);
    
    console.log("✅ Created users:");
    savedUsers.forEach(user => {
      console.log(`   - ${user.fullname} (${user.email}) - Role: ${user.role}`);
    });

    console.log("🎉 Successfully seeded users!");
    
  } catch (error) {
    console.error("❌ Error seeding users:", error);
  } finally {
    await AppDataSource.destroy();
    process.exit(0);
  }
}

seedUsersAndRoles();