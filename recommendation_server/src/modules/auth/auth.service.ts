
import { Repository } from "typeorm";
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
import { UpdateProfileDto } from "./dto/auth.dto";
import { GenderType } from "../users/enum/user.enum";

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
    const { fullname, email, password, phone_number, address, gender, date_of_birth, role } = signupDto;

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
    
    const newUser = this.userRepository.create({
      fullname,
      email,
      phone_number,
      address,
      password: hashedPassword,
      gender: gender as GenderType,
      date_of_birth: birthDate,
      role: role || RoleType.USER,
      is_verified: false,
     
    });
    const savedUser = await this.userRepository.save(newUser);
    return {
      message: "Registration successful",
      user: {
        id: savedUser.id,
        fullname: savedUser.fullname,
        email: savedUser.email,
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