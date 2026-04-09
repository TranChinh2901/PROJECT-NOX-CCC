import Joi from "joi";
import { RoleType } from "@/modules/auth/enum/auth.enum";

export const updateUserSchema = Joi.object({
  fullname: Joi.string().min(1).max(100).messages({
    "string.base": "Fullname must be a string",
    "string.min": "Fullname cannot be empty",
    "string.max": "Fullname must not exceed 100 characters",
  }),
  email: Joi.string().email().max(150).messages({
    "string.base": "Email must be a string",
    "string.email": "Email must be a valid email address",
    "string.max": "Email must not exceed 150 characters",
  }),
  phone_number: Joi.string().pattern(/^[0-9]{10,11}$/).messages({
    "string.base": "Phone number must be a string",
    "string.pattern.base": "Phone number must be 10-11 digits",
  }),
  avatar: Joi.string().uri().max(255).allow(null, '').messages({
    "string.base": "Avatar must be a string",
    "string.uri": "Avatar must be a valid URL",
    "string.max": "Avatar must not exceed 255 characters",
  }),
  role: Joi.string().valid(...Object.values(RoleType)).messages({
    "any.only": "Role must be either ADMIN or USER",
  }),
}).min(1).messages({
  "object.min": "At least one field must be provided for update",
});

export const bulkDeactivateSchema = Joi.object({
  ids: Joi.array()
    .items(Joi.number().integer().positive())
    .min(1)
    .max(100)
    .required()
    .messages({
      "array.base": "IDs must be an array",
      "array.min": "At least one ID must be provided",
      "array.max": "Cannot deactivate more than 100 users at once",
      "number.base": "Each ID must be a number",
      "number.integer": "Each ID must be an integer",
      "number.positive": "Each ID must be positive",
      "any.required": "IDs are required",
    }),
});
