"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RefreshTokenSchema = exports.RegisterSchema = void 0;
const user_enum_1 = require("@/modules/users/enum/user.enum");
const joi_1 = __importDefault(require("joi"));
const auth_enum_1 = require("../enum/auth.enum");
exports.RegisterSchema = joi_1.default.object({
    fullname: joi_1.default.string().min(2).max(100).required().messages({
        "string.empty": "Full name is required",
        "string.min": "Full name must be at least 2 characters",
        "string.max": "Full name must be at most 100 characters",
        "any.required": "Full name is required",
    }),
    email: joi_1.default.string().email().required().messages({
        "string.empty": "Email is required",
        "string.email": "Email must be a valid email address",
        "any.required": "Email is required",
    }),
    password: joi_1.default.string().min(6).required().messages({
        "string.empty": "Password is required",
        "any.required": "Password is required",
    }),
    phone_number: joi_1.default.string().min(10).max(20).required().messages({
        "string.empty": "Phone number is required",
        "any.required": "Phone number is required",
    }),
    address: joi_1.default.string().max(255).optional(),
    gender: joi_1.default.string()
        .valid(...Object.values(user_enum_1.GenderType))
        .required()
        .messages({
        "any.only": `Gender must be one of: ${Object.values(user_enum_1.GenderType).join(", ")}`,
    }),
    date_of_birth: joi_1.default.date().iso().optional(),
    role: joi_1.default.string()
        .valid(...Object.values(auth_enum_1.RoleType))
        .default(auth_enum_1.RoleType.USER)
        .optional(),
});
exports.RefreshTokenSchema = joi_1.default.object({
    refreshToken: joi_1.default.string().required(),
});
