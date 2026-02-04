import Joi from "joi";

export const paginationQuerySchema = Joi.object({
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
});
