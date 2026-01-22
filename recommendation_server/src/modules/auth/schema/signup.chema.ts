import { GenderType } from "@/modules/users/enum/user.enum";
import Joi from "joi";
import { RoleType } from "../enum/auth.enum";

export const RegisterSchema = Joi.object({
  fullname: Joi.string().min(2).max(100).required().messages({
    "string.empty": "Full name is required",
    "string.min": "Full name must be at least 2 characters",
    "string.max": "Full name must be at most 100 characters",
    "any.required": "Full name is required",
  }),
  email: Joi.string().email().required().messages({
    "string.empty": "Email is required",
    "string.email": "Email must be a valid email address",
    "any.required": "Email is required",
  }),
  password: Joi.string().min(6).required().messages({
    "string.empty": "Password is required",
    "any.required": "Password is required",
  }),
  phone_number: Joi.string().min(10).max(20).required().messages({
    "string.empty": "Phone number is required",
    "any.required": "Phone number is required",
  }),
  address: Joi.string().max(255).optional(),
  gender: Joi.string()
    .valid(...Object.values(GenderType))
    .required()
    .messages({
      "any.only": `Gender must be one of: ${Object.values(GenderType).join(
        ", "
      )}`,
    }),
  date_of_birth: Joi.date().iso().optional(),
  role: Joi.string()
    .valid(...Object.values(RoleType))
    .default(RoleType.USER)
    .optional(),
});

export const RefreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required(),
});
