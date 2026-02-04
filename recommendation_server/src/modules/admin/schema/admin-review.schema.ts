import Joi from "joi";

export const reviewFilterQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional().messages({
    "number.base": "Page must be a number",
    "number.integer": "Page must be an integer",
    "number.min": "Page must be at least 1",
  }),
  limit: Joi.number().integer().min(1).max(100).optional().messages({
    "number.base": "Limit must be a number",
    "number.integer": "Limit must be an integer",
    "number.min": "Limit must be at least 1",
    "number.max": "Limit must not exceed 100",
  }),
  sortBy: Joi.string().optional().messages({
    "string.base": "Sort by must be a string",
  }),
  sortOrder: Joi.string().valid('ASC', 'DESC').optional().messages({
    "string.base": "Sort order must be a string",
    "any.only": "Sort order must be either ASC or DESC",
  }),
  search: Joi.string().optional().allow('').messages({
    "string.base": "Search must be a string",
  }),
  is_approved: Joi.boolean().optional().messages({
    "boolean.base": "Is approved must be a boolean",
  }),
  product_id: Joi.number().integer().positive().optional().messages({
    "number.base": "Product ID must be a number",
    "number.integer": "Product ID must be an integer",
    "number.positive": "Product ID must be positive",
  }),
  user_id: Joi.number().integer().positive().optional().messages({
    "number.base": "User ID must be a number",
    "number.integer": "User ID must be an integer",
    "number.positive": "User ID must be positive",
  }),
  rating: Joi.number().integer().min(1).max(5).optional().messages({
    "number.base": "Rating must be a number",
    "number.integer": "Rating must be an integer",
    "number.min": "Rating must be at least 1",
    "number.max": "Rating must not exceed 5",
  }),
});

export const bulkApproveSchema = Joi.object({
  ids: Joi.array().items(Joi.number().integer().positive()).min(1).max(100).required().messages({
    "array.base": "IDs must be an array",
    "array.min": "At least one ID must be provided",
    "array.max": "Cannot approve more than 100 items at once",
    "any.required": "IDs are required",
    "number.base": "Each ID must be a number",
    "number.integer": "Each ID must be an integer",
    "number.positive": "Each ID must be positive",
  }),
});
