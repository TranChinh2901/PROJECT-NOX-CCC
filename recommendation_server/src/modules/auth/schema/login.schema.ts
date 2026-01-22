import { GenderType } from "@/modules/users/enum/user.enum";
import Joi from "joi";
import { RoleType } from "../enum/auth.enum";

export const LoginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.empty": "Email is required",
    "string.email": "Email must be a valid email address",
    "any.required": "Email is required",
  }),
  password: Joi.string().min(6).required().messages({
    "string.empty": "Password is required",
    "any.required": "Password is required",
  }),
});



export const UpdateProfileSchema = Joi.object({
  fullname: Joi.string().min(2).max(100).optional().messages({
    'string.min': 'Full name must be at least 2 characters long',
    'string.max': 'Full name must not exceed 100 characters'
  }),
  phone_number: Joi.string().pattern(/^[0-9]{10,11}$/).optional().messages({
    'string.pattern.base': 'Phone number must be 10-11 digits'
  }),
  address: Joi.string().max(255).optional().messages({
    'string.max': 'Address must not exceed 255 characters'
  }),
  gender: Joi.string().valid('male', 'female').optional(),
  date_of_birth: Joi.date().optional(),
  avatar: Joi.string().uri().optional().messages({
    'string.uri': 'Avatar must be a valid URL'
  })
});