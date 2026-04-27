
import { EntityManager, Repository } from "typeorm";
import { compare, hash } from "bcryptjs";

import { AppDataSource } from "@/config/database.config";
import { AppError } from "@/common/error.response";
import { HttpStatusCode } from "@/constants/status-code";
import { ErrorCode } from "@/constants/error-code";
import { User } from "@/modules/users/entity/user.entity";
import { JwtUtils } from "@/utils/jwt.util";
import { RoleType } from "./enum/auth.enum";
import { LoginDto } from "./dto/login.dto";
import { SignupDto } from "./dto/signup.dto";
import { ErrorMessages, SuccessMessages } from "@/constants/message";
import { ChangePasswordDto, UpdateProfileDto } from "./dto/auth.dto";
import { GenderType } from "../users/enum/user.enum";
import { Notification } from "@/modules/notification/entity/notification";
import { NotificationPriority, NotificationType } from "@/modules/notification/enum/notification.enum";

export class AuthService {
  private userRepository: Repository<User>;
  private readonly SALT_ROUNDS: number;

  constructor() {
    this.userRepository = AppDataSource.getRepository(User);
    this.SALT_ROUNDS = 10;
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;
    const user = await this.userRepository.findOne({
      where: { email }
    });

    if (!user) {
      throw new AppError(
        ErrorMessages.AUTH.INVALID_CREDENTIALS,
        HttpStatusCode.UNAUTHORIZED,
        ErrorCode.UNAUTHORIZED
      );
    }
    const isPasswordValid = await compare(password, user.password);
    if (!isPasswordValid) {
      throw new AppError(
        ErrorMessages.AUTH.INVALID_CREDENTIALS,
        HttpStatusCode.UNAUTHORIZED,
        ErrorCode.UNAUTHORIZED
      );
    }

    await this.ensureWelcomeNotification(user);

    const tokens = this.generateToken(user);
    return {
      ...tokens,
      user: {
        id: user.id,
        fullname: user.fullname,
        email: user.email,
        phone_number: user.phone_number,
        address: user.address,
        gender: user.gender,
        date_of_birth: user.date_of_birth,
        avatar: user.avatar,
        is_verified: user.is_verified,
        role: user.role
      }
    };
  }

  async register(signupDto: SignupDto) {
    const { fullname, email, password, phone_number, address, gender, date_of_birth } = signupDto;

    const existingUser = await this.userRepository.findOne({
      where: [
        { email },
        { phone_number }
      ]
    });

    if (existingUser) {
      throw new AppError(
        ErrorMessages.USER.ALL_ALREADY_EXISTS,
        HttpStatusCode.CONFLICT,
        ErrorCode.EMAIL_ALREADY_EXISTS,
        { email, phone_number }
      );
    }

    const hashedPassword = await hash(password, this.SALT_ROUNDS);
    const birthDate = typeof date_of_birth === 'string' 
      ? new Date(date_of_birth) 
      : date_of_birth;
    
    const savedUser = await AppDataSource.transaction(async (manager) => {
      const userRepository = manager.getRepository(User);

      const newUser = userRepository.create({
        fullname,
        email,
        phone_number,
        address,
        password: hashedPassword,
        gender: gender as GenderType,
        date_of_birth: birthDate,
        role: RoleType.USER,
        is_verified: false,
      });

      const user = await userRepository.save(newUser);

      await this.createWelcomeNotification(manager, user);

      return user;
    });

    const tokens = this.generateToken(savedUser);
    return {
      message: "Registration successful",
      ...tokens,
      user: {
        id: savedUser.id,
        fullname: savedUser.fullname,
        email: savedUser.email,
        phone_number: savedUser.phone_number,
        address: savedUser.address,
        gender: savedUser.gender,
        date_of_birth: savedUser.date_of_birth,
        avatar: savedUser.avatar,
        is_verified: savedUser.is_verified,
        role: savedUser.role
      }
    };
  }

  generateToken(user: User) {
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    return {
      accessToken: JwtUtils.generateAccessToken(payload),
      refreshToken: JwtUtils.generateRefreshToken(payload)
    };
  }

  verifyToken(token: string) {
    try {
      return JwtUtils.verifyAccessToken(token) as {
        id: number;
        email: string;
        role: string;
      };
    } catch (error) {
      return null;
    }
  }

  private async ensureWelcomeNotification(user: User): Promise<void> {
    const notificationRepository = AppDataSource.getRepository(Notification);
    const welcomeCount = await notificationRepository.count({
      where: {
        user_id: user.id,
        type: NotificationType.WELCOME,
      },
    });

    if (welcomeCount === 0) {
      await this.createWelcomeNotification(AppDataSource.manager, user);
    }
  }

  private async createWelcomeNotification(
    manager: EntityManager,
    user: User
  ): Promise<void> {
    const notificationRepository = manager.getRepository(Notification);

    await notificationRepository.save(
      notificationRepository.create({
        user_id: user.id,
        type: NotificationType.WELCOME,
        title: "Xin chào!",
        message: `Chào mừng ${user.fullname} đến với TechNova. Chúc bạn có trải nghiệm mua sắm thật tốt tại website của chúng tôi.`,
        priority: NotificationPriority.NORMAL,
        data: { userName: user.fullname },
        action_url: "/",
        reference_id: user.id,
        reference_type: "user",
        is_read: false,
        is_archived: false,
      })
    );
  }

  verifyRefreshToken(token: string) {
    try {
      return JwtUtils.verifyRefreshToken(token) as {
        id: number;
        email: string;
        role: string;
      };
    } catch (error) {
      return null;
    }
  }

  async refreshToken(refreshToken: string) {
    const decoded = this.verifyRefreshToken(refreshToken);
    if (!decoded) {
      throw new AppError(
        ErrorMessages.AUTH.INVALID_TOKEN,
        HttpStatusCode.UNAUTHORIZED,
        ErrorCode.INVALID_TOKEN
      );
    }

    const user = await this.userRepository.findOne({
      where: { id: decoded.id }
    });

    if (!user) {
      throw new AppError(
        ErrorMessages.USER.USER_NOT_FOUND,
        HttpStatusCode.UNAUTHORIZED,
        ErrorCode.USER_NOT_FOUND
      );
    }

    const tokens = this.generateToken(user);
    
    return {
      ...tokens,
      user: {
        id: user.id,
        fullname: user.fullname,
        email: user.email,
        role: user.role
      }
    };
  }


  async getProfile(userId: number) {
    const user = await this.userRepository.findOne({
      where: { id: userId }
    });

    if (!user) {
      throw new AppError(
        ErrorMessages.USER.USER_NOT_FOUND,
        HttpStatusCode.NOT_FOUND,
        ErrorCode.USER_NOT_FOUND
      );
    }

    return {
      id: user.id,
      fullname: user.fullname,
      email: user.email,
      phone_number: user.phone_number,
      address: user.address,
      avatar: user.avatar,
      gender: user.gender,
      date_of_birth: user.date_of_birth,
      is_verified: user.is_verified,
      role: user.role,
      created_at: user.created_at,
      updated_at: user.updated_at
    };
  }

  async getAllUsers(query?: { sort?: string; limit?: number }) {
    const { sort = 'newest', limit } = query || {};
    let queryBuilder = this.userRepository.createQueryBuilder('user');
    if (sort === 'newest') {
      queryBuilder = queryBuilder.orderBy('user.created_at', 'DESC');
    } else if (sort === 'oldest') {
      queryBuilder = queryBuilder.orderBy('user.created_at', 'ASC');
    }
    if (limit) {
      queryBuilder = queryBuilder.limit(limit);
    }
    
    const users = await queryBuilder.getMany();
    
    return users.map(user => ({
      id: user.id,
      fullname: user.fullname,
      email: user.email,
      phone_number: user.phone_number,
      address: user.address,
      avatar: user.avatar,
      gender: user.gender,
      date_of_birth: user.date_of_birth,
      is_verified: user.is_verified,
      role: user.role,
      created_at: user.created_at,
      updated_at: user.updated_at
    }));
    
  }

  async changePassword(userId: number, dto: ChangePasswordDto) {
    const user = await this.userRepository.findOne({
      where: { id: userId }
    });

    if (!user) {
      throw new AppError(
        ErrorMessages.USER.USER_NOT_FOUND,
        HttpStatusCode.NOT_FOUND,
        ErrorCode.USER_NOT_FOUND
      );
    }

    const isCurrentPasswordValid = await compare(dto.currentPassword, user.password);

    if (!isCurrentPasswordValid) {
      throw new AppError(
        'Current password is incorrect',
        HttpStatusCode.BAD_REQUEST,
        ErrorCode.VALIDATION_ERROR
      );
    }

    const isSamePassword = await compare(dto.newPassword, user.password);

    if (isSamePassword) {
      throw new AppError(
        'New password must be different from the current password',
        HttpStatusCode.BAD_REQUEST,
        ErrorCode.VALIDATION_ERROR
      );
    }

    const hashedPassword = await hash(dto.newPassword, this.SALT_ROUNDS);
    await this.userRepository.update(userId, { password: hashedPassword });

    return {
      message: 'Password changed successfully'
    };
  }

  async updateProfile(userId: number, updateProfileDto: UpdateProfileDto) {
    const user = await this.userRepository.findOne({
      where: { id: userId }
    });

    if (!user) {
      throw new AppError(
        ErrorMessages.USER.USER_NOT_FOUND,
        HttpStatusCode.NOT_FOUND,
        ErrorCode.USER_NOT_FOUND
      );
    }
    if (updateProfileDto.phone_number && updateProfileDto.phone_number !== user.phone_number) {
      const existingUser = await this.userRepository.findOne({
        where: { phone_number: updateProfileDto.phone_number }
      });

      if (existingUser) {
        throw new AppError(
          "Phone number already exists",
          HttpStatusCode.CONFLICT,
          ErrorCode.EMAIL_ALREADY_EXISTS
        );
      }
    }
    await this.userRepository.update(userId, updateProfileDto);

    const updatedUser = await this.userRepository.findOne({
      where: { id: userId }
    });

    return {
      id: updatedUser!.id,
      fullname: updatedUser!.fullname,
      email: updatedUser!.email,
      phone_number: updatedUser!.phone_number,
      address: updatedUser!.address,
      gender: updatedUser!.gender as GenderType,
      date_of_birth: updatedUser!.date_of_birth,
      avatar: updatedUser!.avatar,
      role: updatedUser!.role as RoleType,
    };
  }

  async deleteAccount(userId: number) {
    const user = await this.userRepository.findOne({
      where: { id: userId }
    });

    if (!user) {
      throw new AppError(
        ErrorMessages.USER.USER_NOT_FOUND,
        HttpStatusCode.NOT_FOUND,
        ErrorCode.USER_NOT_FOUND
      );
    }

    await this.userRepository.remove(user);

    return {
      message: SuccessMessages.USER.USER_DELETED
    };
  }

  async uploadAvatar(userId: number, avatarUrl: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId }
    });

    if (!user) {
      throw new AppError(
        ErrorMessages.USER.USER_NOT_FOUND,
        HttpStatusCode.NOT_FOUND,
        ErrorCode.USER_NOT_FOUND
      );
    }

    await this.userRepository.update(userId, { avatar: avatarUrl });

    const updatedUser = await this.userRepository.findOne({
      where: { id: userId }
    });

    return {
      id: updatedUser!.id,
      fullname: updatedUser!.fullname,
      email: updatedUser!.email,
      avatar: updatedUser!.avatar,
      message: "Avatar uploaded successfully"
    };
  }

  async updateUserById(userId: number, updateData: any) {
    const user = await this.userRepository.findOne({
      where: { id: userId }
    });

    if (!user) {
      throw new AppError(
        ErrorMessages.USER.USER_NOT_FOUND,
        HttpStatusCode.NOT_FOUND,
        ErrorCode.USER_NOT_FOUND
      );
    }
    if (updateData.email && updateData.email !== user.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: updateData.email }
      });
      if (existingUser) {
        throw new AppError(
          'Email đã được sử dụng',
          HttpStatusCode.BAD_REQUEST,
          ErrorCode.VALIDATION_ERROR
        );
      }
    }

    if (updateData.phone_number && updateData.phone_number !== user.phone_number) {
      const existingUser = await this.userRepository.findOne({
        where: { phone_number: updateData.phone_number }
      });
      if (existingUser) {
        throw new AppError(
          'Số điện thoại đã được sử dụng',
          HttpStatusCode.BAD_REQUEST,
          ErrorCode.VALIDATION_ERROR
        );
      }
    }

    // console.log('Data before update:', updateData);
    // console.log('is_verified before update:', updateData.is_verified, typeof updateData.is_verified);

    await this.userRepository.update(userId, updateData);

    const updatedUser = await this.userRepository.findOne({
      where: { id: userId }
    });

    return {
      id: updatedUser!.id,
      fullname: updatedUser!.fullname,
      email: updatedUser!.email,
      phone_number: updatedUser!.phone_number,
      address: updatedUser!.address,
      gender: updatedUser!.gender as GenderType,
      date_of_birth: updatedUser!.date_of_birth,
      avatar: updatedUser!.avatar,
      role: updatedUser!.role as RoleType,
      is_verified: updatedUser!.is_verified,
      created_at: updatedUser!.created_at,
      updated_at: updatedUser!.updated_at
    };
  }
}

export default new AuthService();
