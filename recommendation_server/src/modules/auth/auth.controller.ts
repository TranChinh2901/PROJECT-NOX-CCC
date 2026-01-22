
import { ErrorMessages, SuccessMessages } from '@/constants/message';
import { Request, Response } from 'express';
import authService from './auth.service';
import { AppResponse } from '@/common/success.response';
import { HttpStatusCode } from '@/constants/status-code';
import { AuthenticatedRequest } from '@/middlewares/auth.middleware';
import { ErrorCode } from '@/constants/error-code';
import { AppError } from '@/common/error.response';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/auth.dto';

class AuthController {
  async register(req: Request, res: Response) {
    const signupData: SignupDto = req.body;
    
    const result = await authService.register(signupData);
    
    return new AppResponse({
      message: SuccessMessages.AUTH.REGISTER_SUCCESS,
      statusCode: HttpStatusCode.CREATED,
      data: result
    }).sendResponse(res);
  }

  async login(req: Request, res: Response) {
    const loginData: LoginDto = req.body;
    
    const result = await authService.login(loginData);
    
    return new AppResponse({
      message: SuccessMessages.AUTH.LOGIN_SUCCESS,
      statusCode: HttpStatusCode.OK,
      data: result
    }).sendResponse(res);
  }

  async logout(req: Request, res: Response) {
    return new AppResponse({
      message: SuccessMessages.AUTH.LOGOUT_SUCCESS,
      statusCode: HttpStatusCode.OK,
      data: { message: 'Please remove the token from client storage' }
    }).sendResponse(res);
  }

  async refreshToken(req: Request, res: Response) {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      throw new AppError(
        'Refresh token is required',
        HttpStatusCode.BAD_REQUEST,
        ErrorCode.VALIDATION_ERROR
      );
    }
    
    const result = await authService.refreshToken(refreshToken);
    
    return new AppResponse({
      message: SuccessMessages.AUTH.TOKEN_REFRESHED,
      statusCode: HttpStatusCode.OK,
      data: result
    }).sendResponse(res);
  }

  async getProfile(req: AuthenticatedRequest, res: Response) {
    const user = req.user;
    
    if (!user) {
       throw new AppError(
        ErrorMessages.USER.USER_NOT_FOUND,
        HttpStatusCode.UNAUTHORIZED,
        ErrorCode.UNAUTHORIZED
      );
    }

    const userDetails = await authService.getProfile(user.id);
    
    return new AppResponse({
      message: SuccessMessages.USER.USER_GET, 
      statusCode: HttpStatusCode.OK,
      data: userDetails
    }).sendResponse(res);
  }

  async getAllUsers(req:Request, res: Response) {
    const { sort, limit } = req.query;
    const users = await authService.getAllUsers({
      sort: sort as string,
      limit: limit ? parseInt(limit as string) : undefined
    });
    return new AppResponse({
      message: SuccessMessages.USER.USER_GET,
      statusCode: HttpStatusCode.OK,
      data: users
    }).sendResponse(res);
  }

  async updateProfile(req: AuthenticatedRequest, res: Response) {
    const user = req.user;
    
    if (!user) {
      throw new AppError(
        ErrorMessages.USER.USER_NOT_FOUND,
        HttpStatusCode.UNAUTHORIZED,
        ErrorCode.UNAUTHORIZED
      );
    }

    const updateData: UpdateProfileDto = req.body;
    const result = await authService.updateProfile(user.id, updateData);
    
    return new AppResponse({
      message: SuccessMessages.USER.USER_UPDATED, 
      statusCode: HttpStatusCode.OK,
      data: result
    }).sendResponse(res);
  }

  async deleteAccount(req: AuthenticatedRequest, res: Response) { 
    const user = req.user;
    
    if (!user) {
      throw new AppError(
        ErrorMessages.USER.USER_NOT_FOUND,
        HttpStatusCode.UNAUTHORIZED,
        ErrorCode.UNAUTHORIZED
      );
    }

    await authService.deleteAccount(user.id);
    return new AppResponse({
      message: SuccessMessages.USER.USER_DELETED,
      statusCode: HttpStatusCode.OK,
      data: null
    }).sendResponse(res);
  }

  async uploadAvatar(req: AuthenticatedRequest, res: Response) {
    const user = req.user;

    if (!user) {
      throw new AppError(
        ErrorMessages.USER.USER_NOT_FOUND,
        HttpStatusCode.UNAUTHORIZED,
        ErrorCode.UNAUTHORIZED
      );
    }
    if (!req.file) {
      throw new AppError(
        'Avatar file is required',
        HttpStatusCode.BAD_REQUEST,
        ErrorCode.VALIDATION_ERROR
      );
    }

    const avatarUrl = req.file.path;
    const result = await authService.uploadAvatar(user.id, avatarUrl);

    return new AppResponse({
      message: SuccessMessages.USER.AVATAR_UPLOADED,
      statusCode: HttpStatusCode.OK,
      data: result
    }).sendResponse(res);
  }

  async deleteUserById(req: Request, res: Response) {
    const userId = parseInt(req.params.id);
    
    if (isNaN(userId)) {
      throw new AppError(
        'Invalid user ID',
        HttpStatusCode.BAD_REQUEST,
        ErrorCode.VALIDATION_ERROR
      );
    }

    await authService.deleteAccount(userId);
    
    return new AppResponse({
      message: SuccessMessages.USER.USER_DELETED,
      statusCode: HttpStatusCode.OK,
      data: null
    }).sendResponse(res);
  }

  async updateUserById(req: Request, res: Response) {
    const userId = parseInt(req.params.id);
    
    if (isNaN(userId)) {
      throw new AppError(
        'Invalid user ID',
        HttpStatusCode.BAD_REQUEST,
        ErrorCode.VALIDATION_ERROR
      );
    }

    console.log('Update user request body:', req.body);
    console.log('is_verified in body:', req.body.is_verified);

    const result = await authService.updateUserById(userId, req.body);
    
    return new AppResponse({
      message: SuccessMessages.USER.USER_UPDATED,
      statusCode: HttpStatusCode.OK,
      data: result
    }).sendResponse(res);
  }
}


export default new AuthController();