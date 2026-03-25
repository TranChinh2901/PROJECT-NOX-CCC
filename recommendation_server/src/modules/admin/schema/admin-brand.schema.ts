import Joi from "joi";

export const createBrandSchema = Joi.object({
  name: Joi.string().min(1).max(100).required().messages({
    "string.base": "Name must be a string",
    "string.min": "Name must be at least 1 character",
    "string.max": "Name must not exceed 100 characters",
    "any.required": "Name is required",
  }),
  slug: Joi.string().min(1).max(100).required().messages({
    "string.base": "Slug must be a string",
    "string.min": "Slug must be at least 1 character",
    "string.max": "Slug must not exceed 100 characters",
    "any.required": "Slug is required",
  }),
  description: Joi.string().optional().allow('', null).messages({
    "string.base": "Description must be a string",
  }),
  logo_url: Joi.string().max(255).optional().allow('', null).messages({
    "string.base": "Logo URL must be a string",
    "string.max": "Logo URL must not exceed 255 characters",
  }),
  website_url: Joi.string().max(255).optional().allow('', null).messages({
    "string.base": "Website URL must be a string",
    "string.max": "Website URL must not exceed 255 characters",
  }),
  is_active: Joi.boolean().optional().default(true).messages({
    "boolean.base": "Is active must be a boolean",
  }),
});

export const updateBrandSchema = Joi.object({
  name: Joi.string().min(1).max(100).optional().messages({
    "string.base": "Name must be a string",
    "string.min": "Name must be at least 1 character",
    "string.max": "Name must not exceed 100 characters",
  }),
  slug: Joi.string().min(1).max(100).optional().messages({
    "string.base": "Slug must be a string",
    "string.min": "Slug must be at least 1 character",
    "string.max": "Slug must not exceed 100 characters",
  }),
  description: Joi.string().optional().allow('', null).messages({
    "string.base": "Description must be a string",
  }),
  logo_url: Joi.string().max(255).optional().allow('', null).messages({
    "string.base": "Logo URL must be a string",
    "string.max": "Logo URL must not exceed 255 characters",
  }),
  website_url: Joi.string().max(255).optional().allow('', null).messages({
    "string.base": "Website URL must be a string",
    "string.max": "Website URL must not exceed 255 characters",
  }),
  is_active: Joi.boolean().optional().messages({
    "boolean.base": "Is active must be a boolean",
  }),
}).min(1).messages({
  "object.min": "At least one field must be provided for update",
});
