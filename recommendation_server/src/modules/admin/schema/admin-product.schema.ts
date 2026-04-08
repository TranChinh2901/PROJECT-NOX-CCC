import Joi from "joi";

export const listProductsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1).messages({
    "number.base": "Page must be a number",
    "number.integer": "Page must be an integer",
    "number.min": "Page must be at least 1",
  }),
  limit: Joi.number().integer().min(1).max(100).default(10).messages({
    "number.base": "Limit must be a number",
    "number.integer": "Limit must be an integer",
    "number.min": "Limit must be at least 1",
    "number.max": "Limit must not exceed 100",
  }),
  sortBy: Joi.string().optional().messages({
    "string.base": "Sort by must be a string",
  }),
  sortOrder: Joi.string().valid('ASC', 'DESC').default('DESC').messages({
    "any.only": "Sort order must be either ASC or DESC",
  }),
  search: Joi.string().optional().allow('').messages({
    "string.base": "Search must be a string",
  }),
  category_id: Joi.number().integer().positive().optional().messages({
    "number.base": "Category ID must be a number",
    "number.integer": "Category ID must be an integer",
    "number.positive": "Category ID must be positive",
  }),
  brand_id: Joi.number().integer().positive().optional().messages({
    "number.base": "Brand ID must be a number",
    "number.integer": "Brand ID must be an integer",
    "number.positive": "Brand ID must be positive",
  }),
  is_active: Joi.boolean().optional().messages({
    "boolean.base": "Is active must be a boolean",
  }),
});

export const createProductSchema = Joi.object({
  category_id: Joi.number().integer().positive().required().messages({
    "number.base": "Category ID must be a number",
    "number.integer": "Category ID must be an integer",
    "number.positive": "Category ID must be positive",
    "any.required": "Category ID is required",
  }),
  brand_id: Joi.number().integer().positive().optional().allow(null).messages({
    "number.base": "Brand ID must be a number",
    "number.integer": "Brand ID must be an integer",
    "number.positive": "Brand ID must be positive",
  }),
  name: Joi.string().min(1).max(200).required().messages({
    "string.base": "Name must be a string",
    "string.min": "Name must be at least 1 character",
    "string.max": "Name must not exceed 200 characters",
    "any.required": "Name is required",
  }),
  slug: Joi.string().min(1).max(200).required().messages({
    "string.base": "Slug must be a string",
    "string.min": "Slug must be at least 1 character",
    "string.max": "Slug must not exceed 200 characters",
    "any.required": "Slug is required",
  }),
  sku: Joi.string().min(1).max(100).required().messages({
    "string.base": "SKU must be a string",
    "string.min": "SKU must be at least 1 character",
    "string.max": "SKU must not exceed 100 characters",
    "any.required": "SKU is required",
  }),
  description: Joi.string().required().messages({
    "string.base": "Description must be a string",
    "any.required": "Description is required",
  }),
  short_description: Joi.string().max(500).optional().allow('', null).messages({
    "string.base": "Short description must be a string",
    "string.max": "Short description must not exceed 500 characters",
  }),
  base_price: Joi.number().positive().precision(2).required().messages({
    "number.base": "Base price must be a number",
    "number.positive": "Base price must be positive",
    "any.required": "Base price is required",
  }),
  compare_at_price: Joi.number().positive().precision(2).optional().allow(null).messages({
    "number.base": "Compare at price must be a number",
    "number.positive": "Compare at price must be positive",
  }),
  cost_price: Joi.number().positive().precision(2).optional().allow(null).messages({
    "number.base": "Cost price must be a number",
    "number.positive": "Cost price must be positive",
  }),
  weight_kg: Joi.number().positive().precision(3).optional().allow(null).messages({
    "number.base": "Weight must be a number",
    "number.positive": "Weight must be positive",
  }),
  is_active: Joi.boolean().optional().default(true).messages({
    "boolean.base": "Is active must be a boolean",
  }),
  is_featured: Joi.boolean().optional().default(false).messages({
    "boolean.base": "Is featured must be a boolean",
  }),
  meta_title: Joi.string().max(255).optional().allow('', null).messages({
    "string.base": "Meta title must be a string",
    "string.max": "Meta title must not exceed 255 characters",
  }),
  meta_description: Joi.string().max(500).optional().allow('', null).messages({
    "string.base": "Meta description must be a string",
    "string.max": "Meta description must not exceed 500 characters",
  }),
});

export const updateProductSchema = Joi.object({
  category_id: Joi.number().integer().positive().optional().messages({
    "number.base": "Category ID must be a number",
    "number.integer": "Category ID must be an integer",
    "number.positive": "Category ID must be positive",
  }),
  brand_id: Joi.number().integer().positive().optional().allow(null).messages({
    "number.base": "Brand ID must be a number",
    "number.integer": "Brand ID must be an integer",
    "number.positive": "Brand ID must be positive",
  }),
  name: Joi.string().min(1).max(200).optional().messages({
    "string.base": "Name must be a string",
    "string.min": "Name must be at least 1 character",
    "string.max": "Name must not exceed 200 characters",
  }),
  slug: Joi.string().min(1).max(200).optional().messages({
    "string.base": "Slug must be a string",
    "string.min": "Slug must be at least 1 character",
    "string.max": "Slug must not exceed 200 characters",
  }),
  sku: Joi.string().min(1).max(100).optional().messages({
    "string.base": "SKU must be a string",
    "string.min": "SKU must be at least 1 character",
    "string.max": "SKU must not exceed 100 characters",
  }),
  description: Joi.string().optional().messages({
    "string.base": "Description must be a string",
  }),
  short_description: Joi.string().max(500).optional().allow('', null).messages({
    "string.base": "Short description must be a string",
    "string.max": "Short description must not exceed 500 characters",
  }),
  base_price: Joi.number().positive().precision(2).optional().messages({
    "number.base": "Base price must be a number",
    "number.positive": "Base price must be positive",
  }),
  compare_at_price: Joi.number().positive().precision(2).optional().allow(null).messages({
    "number.base": "Compare at price must be a number",
    "number.positive": "Compare at price must be positive",
  }),
  cost_price: Joi.number().positive().precision(2).optional().allow(null).messages({
    "number.base": "Cost price must be a number",
    "number.positive": "Cost price must be positive",
  }),
  weight_kg: Joi.number().positive().precision(3).optional().allow(null).messages({
    "number.base": "Weight must be a number",
    "number.positive": "Weight must be positive",
  }),
  is_active: Joi.boolean().optional().messages({
    "boolean.base": "Is active must be a boolean",
  }),
  is_featured: Joi.boolean().optional().messages({
    "boolean.base": "Is featured must be a boolean",
  }),
  meta_title: Joi.string().max(255).optional().allow('', null).messages({
    "string.base": "Meta title must be a string",
    "string.max": "Meta title must not exceed 255 characters",
  }),
  meta_description: Joi.string().max(500).optional().allow('', null).messages({
    "string.base": "Meta description must be a string",
    "string.max": "Meta description must not exceed 500 characters",
  }),
}).min(1).messages({
  "object.min": "At least one field must be provided for update",
});
