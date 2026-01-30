"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const message_1 = require("@/constants/message");
const auth_service_1 = __importDefault(require("./auth.service"));
const success_response_1 = require("@/common/success.response");
const status_code_1 = require("@/constants/status-code");
const error_code_1 = require("@/constants/error-code");
const error_response_1 = require("@/common/error.response");
class AuthController {
    async register(req, res) {
        const signupData = req.body;
        const result = await auth_service_1.default.register(signupData);
        return new success_response_1.AppResponse({
            message: message_1.SuccessMessages.AUTH.REGISTER_SUCCESS,
            statusCode: status_code_1.HttpStatusCode.CREATED,
            data: result
        }).sendResponse(res);
    }
    async login(req, res) {
        const loginData = req.body;
        const result = await auth_service_1.default.login(loginData);
        return new success_response_1.AppResponse({
            message: message_1.SuccessMessages.AUTH.LOGIN_SUCCESS,
            statusCode: status_code_1.HttpStatusCode.OK,
            data: result
        }).sendResponse(res);
    }
    async logout(req, res) {
        return new success_response_1.AppResponse({
            message: message_1.SuccessMessages.AUTH.LOGOUT_SUCCESS,
            statusCode: status_code_1.HttpStatusCode.OK,
            data: { message: 'Please remove the token from client storage' }
        }).sendResponse(res);
    }
    async refreshToken(req, res) {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            throw new error_response_1.AppError('Refresh token is required', status_code_1.HttpStatusCode.BAD_REQUEST, error_code_1.ErrorCode.VALIDATION_ERROR);
        }
        const result = await auth_service_1.default.refreshToken(refreshToken);
        return new success_response_1.AppResponse({
            message: message_1.SuccessMessages.AUTH.TOKEN_REFRESHED,
            statusCode: status_code_1.HttpStatusCode.OK,
            data: result
        }).sendResponse(res);
    }
    async getProfile(req, res) {
        const user = req.user;
        if (!user) {
            throw new error_response_1.AppError(message_1.ErrorMessages.USER.USER_NOT_FOUND, status_code_1.HttpStatusCode.UNAUTHORIZED, error_code_1.ErrorCode.UNAUTHORIZED);
        }
        const userDetails = await auth_service_1.default.getProfile(user.id);
        return new success_response_1.AppResponse({
            message: message_1.SuccessMessages.USER.USER_GET,
            statusCode: status_code_1.HttpStatusCode.OK,
            data: userDetails
        }).sendResponse(res);
    }
    async getAllUsers(req, res) {
        const { sort, limit } = req.query;
        const users = await auth_service_1.default.getAllUsers({
            sort: sort,
            limit: limit ? parseInt(limit) : undefined
        });
        return new success_response_1.AppResponse({
            message: message_1.SuccessMessages.USER.USER_GET,
            statusCode: status_code_1.HttpStatusCode.OK,
            data: users
        }).sendResponse(res);
    }
    async updateProfile(req, res) {
        const user = req.user;
        if (!user) {
            throw new error_response_1.AppError(message_1.ErrorMessages.USER.USER_NOT_FOUND, status_code_1.HttpStatusCode.UNAUTHORIZED, error_code_1.ErrorCode.UNAUTHORIZED);
        }
        const updateData = req.body;
        const result = await auth_service_1.default.updateProfile(user.id, updateData);
        return new success_response_1.AppResponse({
            message: message_1.SuccessMessages.USER.USER_UPDATED,
            statusCode: status_code_1.HttpStatusCode.OK,
            data: result
        }).sendResponse(res);
    }
    async deleteAccount(req, res) {
        const user = req.user;
        if (!user) {
            throw new error_response_1.AppError(message_1.ErrorMessages.USER.USER_NOT_FOUND, status_code_1.HttpStatusCode.UNAUTHORIZED, error_code_1.ErrorCode.UNAUTHORIZED);
        }
        await auth_service_1.default.deleteAccount(user.id);
        return new success_response_1.AppResponse({
            message: message_1.SuccessMessages.USER.USER_DELETED,
            statusCode: status_code_1.HttpStatusCode.OK,
            data: null
        }).sendResponse(res);
    }
    async uploadAvatar(req, res) {
        const user = req.user;
        if (!user) {
            throw new error_response_1.AppError(message_1.ErrorMessages.USER.USER_NOT_FOUND, status_code_1.HttpStatusCode.UNAUTHORIZED, error_code_1.ErrorCode.UNAUTHORIZED);
        }
        if (!req.file) {
            throw new error_response_1.AppError('Avatar file is required', status_code_1.HttpStatusCode.BAD_REQUEST, error_code_1.ErrorCode.VALIDATION_ERROR);
        }
        const avatarUrl = req.file.path;
        const result = await auth_service_1.default.uploadAvatar(user.id, avatarUrl);
        return new success_response_1.AppResponse({
            message: message_1.SuccessMessages.USER.AVATAR_UPLOADED,
            statusCode: status_code_1.HttpStatusCode.OK,
            data: result
        }).sendResponse(res);
    }
    async deleteUserById(req, res) {
        const userId = parseInt(req.params.id);
        if (isNaN(userId)) {
            throw new error_response_1.AppError('Invalid user ID', status_code_1.HttpStatusCode.BAD_REQUEST, error_code_1.ErrorCode.VALIDATION_ERROR);
        }
        await auth_service_1.default.deleteAccount(userId);
        return new success_response_1.AppResponse({
            message: message_1.SuccessMessages.USER.USER_DELETED,
            statusCode: status_code_1.HttpStatusCode.OK,
            data: null
        }).sendResponse(res);
    }
    async updateUserById(req, res) {
        const userId = parseInt(req.params.id);
        if (isNaN(userId)) {
            throw new error_response_1.AppError('Invalid user ID', status_code_1.HttpStatusCode.BAD_REQUEST, error_code_1.ErrorCode.VALIDATION_ERROR);
        }
        console.log('Update user request body:', req.body);
        console.log('is_verified in body:', req.body.is_verified);
        const result = await auth_service_1.default.updateUserById(userId, req.body);
        return new success_response_1.AppResponse({
            message: message_1.SuccessMessages.USER.USER_UPDATED,
            statusCode: status_code_1.HttpStatusCode.OK,
            data: result
        }).sendResponse(res);
    }
}
exports.default = new AuthController();
