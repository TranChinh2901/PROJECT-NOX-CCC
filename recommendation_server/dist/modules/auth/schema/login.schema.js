"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateProfileSchema = exports.LoginSchema = void 0;
const joi_1 = __importDefault(require("joi"));
exports.LoginSchema = joi_1.default.object({
    email: joi_1.default.string().email().required().messages({
        "string.empty": "Email is required",
        "string.email": "Email must be a valid email address",
        "any.required": "Email is required",
    }),
    password: joi_1.default.string().min(6).required().messages({
        "string.empty": "Password is required",
        "any.required": "Password is required",
    }),
});
exports.UpdateProfileSchema = joi_1.default.object({
    fullname: joi_1.default.string().min(2).max(100).optional().messages({
        'string.min': 'Full name must be at least 2 characters long',
        'string.max': 'Full name must not exceed 100 characters'
    }),
    phone_number: joi_1.default.string().pattern(/^[0-9]{10,11}$/).optional().messages({
        'string.pattern.base': 'Phone number must be 10-11 digits'
    }),
    address: joi_1.default.string().max(255).optional().messages({
        'string.max': 'Address must not exceed 255 characters'
    }),
    gender: joi_1.default.string().valid('male', 'female').optional(),
    date_of_birth: joi_1.default.date().optional(),
    avatar: joi_1.default.string().uri().optional().messages({
        'string.uri': 'Avatar must be a valid URL'
    })
});
