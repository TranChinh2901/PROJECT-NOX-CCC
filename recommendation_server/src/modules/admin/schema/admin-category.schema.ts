import Joi from "joi";

export const createCategorySchema = Joi.object({
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
  parent_id: Joi.number().integer().positive().optional().allow(null).messages({
    "number.base": "Parent ID must be a number",
    "number.integer": "Parent ID must be an integer",
    "number.positive": "Parent ID must be positive",
  }),
  image_url: Joi.string().uri().max(255).optional().allow('', null).messages({
    "string.base": "Image URL must be a string",
    "string.uri": "Image URL must be a valid URI",
    "string.max": "Image URL must not exceed 255 characters",
  }),
  sort_order: Joi.number().integer().min(0).optional().default(0).messages({
    "number.base": "Sort order must be a number",
    "number.integer": "Sort order must be an integer",
    "number.min": "Sort order must be at least 0",
  }),
  is_active: Joi.boolean().optional().default(true).messages({
    "boolean.base": "Is active must be a boolean",
  }),
});

export const updateCategorySchema = Joi.object({
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
  parent_id: Joi.number().integer().positive().optional().allow(null).messages({
    "number.base": "Parent ID must be a number",
    "number.integer": "Parent ID must be an integer",
    "number.positive": "Parent ID must be positive",
  }),
  image_url: Joi.string().uri().max(255).optional().allow('', null).messages({
    "string.base": "Image URL must be a string",
    "string.uri": "Image URL must be a valid URI",
    "string.max": "Image URL must not exceed 255 characters",
  }),
  sort_order: Joi.number().integer().min(0).optional().messages({
    "number.base": "Sort order must be a number",
    "number.integer": "Sort order must be an integer",
    "number.min": "Sort order must be at least 0",
  }),
  is_active: Joi.boolean().optional().messages({
    "boolean.base": "Is active must be a boolean",
  }),
}).min(1).messages({
  "object.min": "At least one field must be provided for update",
});
