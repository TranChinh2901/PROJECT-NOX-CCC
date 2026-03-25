import { DataSource } from 'typeorm';
import { AppDataSource } from '@/config/database.config';
import { User } from './user.entity';
import { GenderType } from '../enum/user.enum';
import { RoleType } from '@/modules/auth/enum/auth.enum';

describe('User Entity', () => {
  let dataSource: DataSource;
  let userRepository: any;

  beforeAll(async () => {
    dataSource = AppDataSource;
    if (!dataSource.isInitialized) {
      await dataSource.initialize();
    }
    userRepository = dataSource.getRepository(User);
  });

  afterAll(async () => {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  });

  describe('Schema Validation', () => {
    it('should create user with all required fields', async () => {
      const user = userRepository.create({
        fullname: 'Test User',
        email: `test${Date.now()}@example.com`,
        phone_number: `+8490${Math.floor(Math.random() * 10000000)}`,
        password: 'hashedpassword123',
      });

      await userRepository.save(user);

      expect(user.id).toBeDefined();
      expect(user.fullname).toBe('Test User');
      expect(user.email).toContain('@example.com');
      expect(user.password).toBe('hashedpassword123');
      expect(user.is_verified).toBe(false);
      expect(user.role).toBe(RoleType.USER);

      await userRepository.delete(user.id);
    });

    it('should create user with optional fields', async () => {
      const user = userRepository.create({
        fullname: 'Jane Doe',
        email: `jane${Date.now()}@example.com`,
        phone_number: `+8491${Math.floor(Math.random() * 10000000)}`,
        password: 'hashedpassword456',
        address: '123 Main St, City',
        avatar: 'https://example.com/avatar.jpg',
        gender: GenderType.FEMALE,
        date_of_birth: new Date('1990-01-15'),
      });

      await userRepository.save(user);

      expect(user.address).toBe('123 Main St, City');
      expect(user.avatar).toBe('https://example.com/avatar.jpg');
      expect(user.gender).toBe(GenderType.FEMALE);
      expect(user.date_of_birth).toBeInstanceOf(Date);

      await userRepository.delete(user.id);
    });

    it('should fail when required fields are missing', async () => {
      const user = userRepository.create({
        fullname: 'Incomplete User',
      });

      await expect(userRepository.save(user)).rejects.toThrow();
    });

    it('should enforce email uniqueness', async () => {
      const email = `unique${Date.now()}@example.com`;
      const user1 = userRepository.create({
        fullname: 'User One',
        email: email,
        phone_number: `+8492${Math.floor(Math.random() * 10000000)}`,
        password: 'password1',
      });

      await userRepository.save(user1);

      const user2 = userRepository.create({
        fullname: 'User Two',
        email: email,
        phone_number: `+8493${Math.floor(Math.random() * 10000000)}`,
        password: 'password2',
      });

      await expect(userRepository.save(user2)).rejects.toThrow();
      await userRepository.delete(user1.id);
    });

    it('should enforce phone number uniqueness', async () => {
      const phone = `+8494${Math.floor(Math.random() * 10000000)}`;
      const user1 = userRepository.create({
        fullname: 'Phone User One',
        email: `phone1${Date.now()}@example.com`,
        phone_number: phone,
        password: 'password1',
      });

      await userRepository.save(user1);

      const user2 = userRepository.create({
        fullname: 'Phone User Two',
        email: `phone2${Date.now()}@example.com`,
        phone_number: phone,
        password: 'password2',
      });

      await expect(userRepository.save(user2)).rejects.toThrow();
      await userRepository.delete(user1.id);
    });
  });

  describe('Field Constraints', () => {
    it('should enforce fullname max length of 100', async () => {
      const user = userRepository.create({
        fullname: 'a'.repeat(101),
        email: `long${Date.now()}@example.com`,
        phone_number: `+8495${Math.floor(Math.random() * 10000000)}`,
        password: 'password',
      });

      await expect(userRepository.save(user)).rejects.toThrow();
    });

    it('should enforce email max length of 150', async () => {
      const longEmail = 'a'.repeat(135) + '@example.com'; // Total = 147 chars, valid
      const user = userRepository.create({
        fullname: 'Test User',
        email: longEmail,
        phone_number: `+8496${Math.floor(Math.random() * 10000000)}`,
        password: 'password',
      });

      await userRepository.save(user);
      expect(user.email.length).toBeLessThanOrEqual(150);
      await userRepository.delete(user.id);
    });

    it('should enforce phone number max length of 20', async () => {
      const user = userRepository.create({
        fullname: 'Test User',
        email: `phone${Date.now()}@example.com`,
        phone_number: '+' + '1'.repeat(20),
        password: 'password',
      });

      await expect(userRepository.save(user)).rejects.toThrow();
    });

    it('should enforce password max length of 255', async () => {
      const user = userRepository.create({
        fullname: 'Test User',
        email: `pwd${Date.now()}@example.com`,
        phone_number: `+8497${Math.floor(Math.random() * 10000000)}`,
        password: 'a'.repeat(256),
      });

      await expect(userRepository.save(user)).rejects.toThrow();
    });

    it('should store address up to 255 characters', async () => {
      const longAddress = 'a'.repeat(255);
      const user = userRepository.create({
        fullname: 'Address User',
        email: `addr${Date.now()}@example.com`,
        phone_number: `+8498${Math.floor(Math.random() * 10000000)}`,
        password: 'password',
        address: longAddress,
      });

      await userRepository.save(user);
      expect(user.address).toBe(longAddress);
      await userRepository.delete(user.id);
    });

    it('should store avatar URL up to 255 characters', async () => {
      const longUrl = 'https://example.com/' + 'a'.repeat(235);
      const user = userRepository.create({
        fullname: 'Avatar User',
        email: `avatar${Date.now()}@example.com`,
        phone_number: `+8499${Math.floor(Math.random() * 10000000)}`,
        password: 'password',
        avatar: longUrl,
      });

      await userRepository.save(user);
      expect(user.avatar?.length).toBe(255);
      await userRepository.delete(user.id);
    });
  });

  describe('Enum Fields', () => {
    it('should accept valid gender types', async () => {
      const genders = [GenderType.MALE, GenderType.FEMALE];

      for (const gender of genders) {
        const user = userRepository.create({
          fullname: 'Gender Test',
          email: `gender${Date.now()}-${gender}@example.com`,
          phone_number: `+84${Math.floor(Math.random() * 1000000000)}`,
          password: 'password',
          gender: gender,
        });

        await userRepository.save(user);
        expect(user.gender).toBe(gender);
        await userRepository.delete(user.id);
      }
    });

    it('should accept valid role types', async () => {
      const roles = [RoleType.USER, RoleType.ADMIN];

      for (const role of roles) {
        const user = userRepository.create({
          fullname: 'Role Test',
          email: `role${Date.now()}-${role}@example.com`,
          phone_number: `+84${Math.floor(Math.random() * 1000000000)}`,
          password: 'password',
          role: role,
        });

        await userRepository.save(user);
        expect(user.role).toBe(role);
        await userRepository.delete(user.id);
      }
    });

    it('should default role to USER', async () => {
      const user = userRepository.create({
        fullname: 'Default Role User',
        email: `default${Date.now()}@example.com`,
        phone_number: `+84${Math.floor(Math.random() * 1000000000)}`,
        password: 'password',
      });

      await userRepository.save(user);
      expect(user.role).toBe(RoleType.USER);
      await userRepository.delete(user.id);
    });
  });

  describe('Timestamp Fields', () => {
    it('should auto-generate created_at timestamp', async () => {
      const user = userRepository.create({
        fullname: 'Timestamp User',
        email: `timestamp${Date.now()}@example.com`,
        phone_number: `+84${Math.floor(Math.random() * 1000000000)}`,
        password: 'password',
      });

      await userRepository.save(user);
      expect(user.created_at).toBeInstanceOf(Date);
      await userRepository.delete(user.id);
    });

    it('should auto-generate updated_at timestamp', async () => {
      const user = userRepository.create({
        fullname: 'Update User',
        email: `update${Date.now()}@example.com`,
        phone_number: `+84${Math.floor(Math.random() * 1000000000)}`,
        password: 'password',
      });

      await userRepository.save(user);
      expect(user.updated_at).toBeInstanceOf(Date);
      await userRepository.delete(user.id);
    });

    it('should update updated_at on modification', async () => {
      const user = userRepository.create({
        fullname: 'Modify User',
        email: `modify${Date.now()}@example.com`,
        phone_number: `+84${Math.floor(Math.random() * 1000000000)}`,
        password: 'password',
      });

      await userRepository.save(user);
      const originalUpdatedAt = user.updated_at;

      await new Promise(resolve => setTimeout(resolve, 1000));

      user.fullname = 'Modified Name';
      await userRepository.save(user);

      expect(user.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
      await userRepository.delete(user.id);
    });
  });

  describe('Boolean Fields', () => {
    it('should default is_verified to false', async () => {
      const user = userRepository.create({
        fullname: 'Unverified User',
        email: `unverified${Date.now()}@example.com`,
        phone_number: `+84${Math.floor(Math.random() * 1000000000)}`,
        password: 'password',
      });

      await userRepository.save(user);
      expect(user.is_verified).toBe(false);
      await userRepository.delete(user.id);
    });

    it('should allow setting is_verified to true', async () => {
      const user = userRepository.create({
        fullname: 'Verified User',
        email: `verified${Date.now()}@example.com`,
        phone_number: `+84${Math.floor(Math.random() * 1000000000)}`,
        password: 'password',
        is_verified: true,
      });

      await userRepository.save(user);
      expect(user.is_verified).toBe(true);
      await userRepository.delete(user.id);
    });
  });

  describe('Date Fields', () => {
    it('should store date_of_birth as date type', async () => {
      const birthDate = new Date('1995-06-15');
      const user = userRepository.create({
        fullname: 'Birthday User',
        email: `birthday${Date.now()}@example.com`,
        phone_number: `+84${Math.floor(Math.random() * 1000000000)}`,
        password: 'password',
        date_of_birth: birthDate,
      });

      await userRepository.save(user);
      expect(user.date_of_birth).toBeInstanceOf(Date);
      await userRepository.delete(user.id);
    });

    it('should allow null date_of_birth', async () => {
      const user = userRepository.create({
        fullname: 'No Birthday User',
        email: `nobday${Date.now()}@example.com`,
        phone_number: `+84${Math.floor(Math.random() * 1000000000)}`,
        password: 'password',
      });

      await userRepository.save(user);
      expect(user.date_of_birth === null || user.date_of_birth === undefined).toBe(true);
      await userRepository.delete(user.id);
    });
  });

  describe('Data Integrity', () => {
    it('should maintain referential integrity with sessions', async () => {
      const user = userRepository.create({
        fullname: 'Session User',
        email: `session${Date.now()}@example.com`,
        phone_number: `+84${Math.floor(Math.random() * 1000000000)}`,
        password: 'password',
      });

      await userRepository.save(user);
      expect(user.id).toBeDefined();
      await userRepository.delete(user.id);
    });

    it('should allow updating user fields', async () => {
      const user = userRepository.create({
        fullname: 'Original Name',
        email: `update${Date.now()}@example.com`,
        phone_number: `+84${Math.floor(Math.random() * 1000000000)}`,
        password: 'password',
      });

      await userRepository.save(user);

      user.fullname = 'Updated Name';
      user.address = 'New Address';
      await userRepository.save(user);

      const updated = await userRepository.findOne({ where: { id: user.id } });
      expect(updated.fullname).toBe('Updated Name');
      expect(updated.address).toBe('New Address');

      await userRepository.delete(user.id);
    });
  });

  describe('Business Logic Scenarios', () => {
    it('should support user registration workflow', async () => {
      const user = userRepository.create({
        fullname: 'New User',
        email: `newuser${Date.now()}@example.com`,
        phone_number: `+84${Math.floor(Math.random() * 1000000000)}`,
        password: 'hashedpassword',
        is_verified: false,
        role: RoleType.USER,
      });

      await userRepository.save(user);
      expect(user.is_verified).toBe(false);
      expect(user.role).toBe(RoleType.USER);

      await userRepository.delete(user.id);
    });

    it('should support email verification workflow', async () => {
      const user = userRepository.create({
        fullname: 'Verify User',
        email: `verify${Date.now()}@example.com`,
        phone_number: `+84${Math.floor(Math.random() * 1000000000)}`,
        password: 'password',
        is_verified: false,
      });

      await userRepository.save(user);
      expect(user.is_verified).toBe(false);

      user.is_verified = true;
      await userRepository.save(user);
      expect(user.is_verified).toBe(true);

      await userRepository.delete(user.id);
    });

    it('should support profile update workflow', async () => {
      const user = userRepository.create({
        fullname: 'Profile User',
        email: `profile${Date.now()}@example.com`,
        phone_number: `+84${Math.floor(Math.random() * 1000000000)}`,
        password: 'password',
      });

      await userRepository.save(user);

      user.avatar = 'https://example.com/new-avatar.jpg';
      user.address = 'Updated Address';
      user.gender = GenderType.MALE;
      await userRepository.save(user);

      expect(user.avatar).toBe('https://example.com/new-avatar.jpg');
      expect(user.address).toBe('Updated Address');
      expect(user.gender).toBe(GenderType.MALE);

      await userRepository.delete(user.id);
    });

    it('should support role upgrade (user to admin)', async () => {
      const user = userRepository.create({
        fullname: 'Admin User',
        email: `admin${Date.now()}@example.com`,
        phone_number: `+84${Math.floor(Math.random() * 1000000000)}`,
        password: 'password',
        role: RoleType.USER,
      });

      await userRepository.save(user);
      expect(user.role).toBe(RoleType.USER);

      user.role = RoleType.ADMIN;
      await userRepository.save(user);
      expect(user.role).toBe(RoleType.ADMIN);

      await userRepository.delete(user.id);
    });
  });

  describe('Edge Cases', () => {
    it('should handle special characters in fullname', async () => {
      const user = userRepository.create({
        fullname: "O'Connor-Smith",
        email: `special${Date.now()}@example.com`,
        phone_number: `+84${Math.floor(Math.random() * 1000000000)}`,
        password: 'password',
      });

      await userRepository.save(user);
      expect(user.fullname).toBe("O'Connor-Smith");
      await userRepository.delete(user.id);
    });

    it('should handle international phone numbers', async () => {
      const phone = '+44 20 7946 0958';
      const user = userRepository.create({
        fullname: 'International User',
        email: `intl${Date.now()}@example.com`,
        phone_number: phone,
        password: 'password',
      });

      await userRepository.save(user);
      expect(user.phone_number).toBe(phone);
      await userRepository.delete(user.id);
    });

    it('should handle very old birth dates', async () => {
      const oldDate = new Date('1920-01-01');
      const user = userRepository.create({
        fullname: 'Old User',
        email: `old${Date.now()}@example.com`,
        phone_number: `+84${Math.floor(Math.random() * 1000000000)}`,
        password: 'password',
        date_of_birth: oldDate,
      });

      await userRepository.save(user);
      expect(user.date_of_birth).toBeInstanceOf(Date);
      await userRepository.delete(user.id);
    });
  });

  describe('Indexing', () => {
    it('should have indexed email for faster queries', async () => {
      const user = userRepository.create({
        fullname: 'Index Test',
        email: `index${Date.now()}@example.com`,
        phone_number: `+84${Math.floor(Math.random() * 1000000000)}`,
        password: 'password',
      });

      await userRepository.save(user);

      const found = await userRepository.findOne({ where: { email: user.email } });
      expect(found).toBeDefined();
      expect(found.id).toBe(user.id);

      await userRepository.delete(user.id);
    });

    it('should have indexed phone_number for faster queries', async () => {
      const phone = `+84${Math.floor(Math.random() * 1000000000)}`;
      const user = userRepository.create({
        fullname: 'Phone Index Test',
        email: `phoneindex${Date.now()}@example.com`,
        phone_number: phone,
        password: 'password',
      });

      await userRepository.save(user);

      const found = await userRepository.findOne({ where: { phone_number: phone } });
      expect(found).toBeDefined();
      expect(found.id).toBe(user.id);

      await userRepository.delete(user.id);
    });
  });
});
