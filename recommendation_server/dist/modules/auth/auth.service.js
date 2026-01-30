"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcryptjs_1 = require("bcryptjs");
const database_config_1 = require("@/config/database.config");
const error_response_1 = require("@/common/error.response");
const status_code_1 = require("@/constants/status-code");
const error_code_1 = require("@/constants/error-code");
const user_entity_1 = require("@/modules/users/entity/user.entity");
const jwt_util_1 = require("@/utils/jwt.util");
const auth_enum_1 = require("./enum/auth.enum");
const message_1 = require("@/constants/message");
class AuthService {
    userRepository;
    SALT_ROUNDS;
    constructor() {
        this.userRepository = database_config_1.AppDataSource.getRepository(user_entity_1.User);
        this.SALT_ROUNDS = 10;
    }
    async login(loginDto) {
        const { email, password } = loginDto;
        const user = await this.userRepository.findOne({
            where: { email }
        });
        if (!user) {
            throw new error_response_1.AppError(message_1.ErrorMessages.AUTH.INVALID_CREDENTIALS, status_code_1.HttpStatusCode.UNAUTHORIZED, error_code_1.ErrorCode.UNAUTHORIZED);
        }
        const isPasswordValid = await (0, bcryptjs_1.compare)(password, user.password);
        if (!isPasswordValid) {
            throw new error_response_1.AppError(message_1.ErrorMessages.AUTH.INVALID_CREDENTIALS, status_code_1.HttpStatusCode.UNAUTHORIZED, error_code_1.ErrorCode.UNAUTHORIZED);
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
    async register(signupDto) {
        const { fullname, email, password, phone_number, address, gender, date_of_birth, role } = signupDto;
        const existingUser = await this.userRepository.findOne({
            where: [
                { email },
                { phone_number }
            ]
        });
        if (existingUser) {
            throw new error_response_1.AppError(message_1.ErrorMessages.USER.ALL_ALREADY_EXISTS, status_code_1.HttpStatusCode.CONFLICT, error_code_1.ErrorCode.EMAIL_ALREADY_EXISTS, { email, phone_number });
        }
        const hashedPassword = await (0, bcryptjs_1.hash)(password, this.SALT_ROUNDS);
        const birthDate = typeof date_of_birth === 'string'
            ? new Date(date_of_birth)
            : date_of_birth;
        const newUser = this.userRepository.create({
            fullname,
            email,
            phone_number,
            address,
            password: hashedPassword,
            gender: gender,
            date_of_birth: birthDate,
            role: role || auth_enum_1.RoleType.USER,
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
    generateToken(user) {
        const payload = {
            id: user.id,
            email: user.email,
            role: user.role,
        };
        return {
            accessToken: jwt_util_1.JwtUtils.generateAccessToken(payload),
            refreshToken: jwt_util_1.JwtUtils.generateRefreshToken(payload)
        };
    }
    verifyToken(token) {
        try {
            return jwt_util_1.JwtUtils.verifyAccessToken(token);
        }
        catch (error) {
            return null;
        }
    }
    verifyRefreshToken(token) {
        try {
            return jwt_util_1.JwtUtils.verifyRefreshToken(token);
        }
        catch (error) {
            return null;
        }
    }
    async refreshToken(refreshToken) {
        const decoded = this.verifyRefreshToken(refreshToken);
        if (!decoded) {
            throw new error_response_1.AppError(message_1.ErrorMessages.AUTH.INVALID_TOKEN, status_code_1.HttpStatusCode.UNAUTHORIZED, error_code_1.ErrorCode.INVALID_TOKEN);
        }
        const user = await this.userRepository.findOne({
            where: { id: decoded.id }
        });
        if (!user) {
            throw new error_response_1.AppError(message_1.ErrorMessages.USER.USER_NOT_FOUND, status_code_1.HttpStatusCode.UNAUTHORIZED, error_code_1.ErrorCode.USER_NOT_FOUND);
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
    async getProfile(userId) {
        const user = await this.userRepository.findOne({
            where: { id: userId }
        });
        if (!user) {
            throw new error_response_1.AppError(message_1.ErrorMessages.USER.USER_NOT_FOUND, status_code_1.HttpStatusCode.NOT_FOUND, error_code_1.ErrorCode.USER_NOT_FOUND);
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
    async getAllUsers(query) {
        const { sort = 'newest', limit } = query || {};
        let queryBuilder = this.userRepository.createQueryBuilder('user');
        if (sort === 'newest') {
            queryBuilder = queryBuilder.orderBy('user.created_at', 'DESC');
        }
        else if (sort === 'oldest') {
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
    async updateProfile(userId, updateProfileDto) {
        const user = await this.userRepository.findOne({
            where: { id: userId }
        });
        if (!user) {
            throw new error_response_1.AppError(message_1.ErrorMessages.USER.USER_NOT_FOUND, status_code_1.HttpStatusCode.NOT_FOUND, error_code_1.ErrorCode.USER_NOT_FOUND);
        }
        if (updateProfileDto.phone_number && updateProfileDto.phone_number !== user.phone_number) {
            const existingUser = await this.userRepository.findOne({
                where: { phone_number: updateProfileDto.phone_number }
            });
            if (existingUser) {
                throw new error_response_1.AppError("Phone number already exists", status_code_1.HttpStatusCode.CONFLICT, error_code_1.ErrorCode.EMAIL_ALREADY_EXISTS);
            }
        }
        await this.userRepository.update(userId, updateProfileDto);
        const updatedUser = await this.userRepository.findOne({
            where: { id: userId }
        });
        return {
            id: updatedUser.id,
            fullname: updatedUser.fullname,
            email: updatedUser.email,
            phone_number: updatedUser.phone_number,
            address: updatedUser.address,
            gender: updatedUser.gender,
            date_of_birth: updatedUser.date_of_birth,
            avatar: updatedUser.avatar,
            role: updatedUser.role,
        };
    }
    async deleteAccount(userId) {
        const user = await this.userRepository.findOne({
            where: { id: userId }
        });
        if (!user) {
            throw new error_response_1.AppError(message_1.ErrorMessages.USER.USER_NOT_FOUND, status_code_1.HttpStatusCode.NOT_FOUND, error_code_1.ErrorCode.USER_NOT_FOUND);
        }
        await this.userRepository.remove(user);
        return {
            message: message_1.SuccessMessages.USER.USER_DELETED
        };
    }
    async uploadAvatar(userId, avatarUrl) {
        const user = await this.userRepository.findOne({
            where: { id: userId }
        });
        if (!user) {
            throw new error_response_1.AppError(message_1.ErrorMessages.USER.USER_NOT_FOUND, status_code_1.HttpStatusCode.NOT_FOUND, error_code_1.ErrorCode.USER_NOT_FOUND);
        }
        await this.userRepository.update(userId, { avatar: avatarUrl });
        const updatedUser = await this.userRepository.findOne({
            where: { id: userId }
        });
        return {
            id: updatedUser.id,
            fullname: updatedUser.fullname,
            email: updatedUser.email,
            avatar: updatedUser.avatar,
            message: "Avatar uploaded successfully"
        };
    }
    async updateUserById(userId, updateData) {
        const user = await this.userRepository.findOne({
            where: { id: userId }
        });
        if (!user) {
            throw new error_response_1.AppError(message_1.ErrorMessages.USER.USER_NOT_FOUND, status_code_1.HttpStatusCode.NOT_FOUND, error_code_1.ErrorCode.USER_NOT_FOUND);
        }
        if (updateData.email && updateData.email !== user.email) {
            const existingUser = await this.userRepository.findOne({
                where: { email: updateData.email }
            });
            if (existingUser) {
                throw new error_response_1.AppError('Email đã được sử dụng', status_code_1.HttpStatusCode.BAD_REQUEST, error_code_1.ErrorCode.VALIDATION_ERROR);
            }
        }
        if (updateData.phone_number && updateData.phone_number !== user.phone_number) {
            const existingUser = await this.userRepository.findOne({
                where: { phone_number: updateData.phone_number }
            });
            if (existingUser) {
                throw new error_response_1.AppError('Số điện thoại đã được sử dụng', status_code_1.HttpStatusCode.BAD_REQUEST, error_code_1.ErrorCode.VALIDATION_ERROR);
            }
        }
        // console.log('Data before update:', updateData);
        // console.log('is_verified before update:', updateData.is_verified, typeof updateData.is_verified);
        await this.userRepository.update(userId, updateData);
        const updatedUser = await this.userRepository.findOne({
            where: { id: userId }
        });
        return {
            id: updatedUser.id,
            fullname: updatedUser.fullname,
            email: updatedUser.email,
            phone_number: updatedUser.phone_number,
            address: updatedUser.address,
            gender: updatedUser.gender,
            date_of_birth: updatedUser.date_of_birth,
            avatar: updatedUser.avatar,
            role: updatedUser.role,
            is_verified: updatedUser.is_verified,
            created_at: updatedUser.created_at,
            updated_at: updatedUser.updated_at
        };
    }
}
exports.AuthService = AuthService;
exports.default = new AuthService();
