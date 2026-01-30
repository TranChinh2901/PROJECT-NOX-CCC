"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadAvatar = void 0;
const multer_1 = __importDefault(require("multer"));
const multer_storage_cloudinary_1 = require("multer-storage-cloudinary");
const cloudinary_config_1 = __importDefault(require("@/config/cloudinary-config"));
const error_response_1 = require("@/common/error.response");
const status_code_1 = require("@/constants/status-code");
const error_code_1 = require("@/constants/error-code");
const avatarStorage = new multer_storage_cloudinary_1.CloudinaryStorage({
    cloudinary: cloudinary_config_1.default,
    params: {
        folder: 'user-avatars',
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        public_id: (req, avatar) => {
            return `avatar_${Date.now()}_${Math.round(Math.random() * 1E9)}`;
        }
    }
});
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    }
    else {
        cb(new error_response_1.AppError('Only image files are allowed', status_code_1.HttpStatusCode.BAD_REQUEST, error_code_1.ErrorCode.VALIDATION_ERROR), false);
    }
};
exports.uploadAvatar = (0, multer_1.default)({
    storage: avatarStorage,
    fileFilter,
    limits: {
        fileSize: 2 * 1024 * 1024 //2mb
    }
});
