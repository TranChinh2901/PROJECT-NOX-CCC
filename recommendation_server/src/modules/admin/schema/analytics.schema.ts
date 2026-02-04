import Joi from "joi";

export const dateRangeQuerySchema = Joi.object({
  start_date: Joi.date().iso().required().messages({
    "date.base": "Start date must be a valid date",
    "date.format": "Start date must be in ISO format",
    "any.required": "Start date is required",
  }),
  end_date: Joi.date().iso().required().min(Joi.ref('start_date')).messages({
    "date.base": "End date must be a valid date",
    "date.format": "End date must be in ISO format",
    "date.min": "End date must be after start date",
    "any.required": "End date is required",
  }),
});

export const topProductsQuerySchema = Joi.object({
  limit: Joi.number().integer().min(1).max(100).default(10).messages({
    "number.base": "Limit must be a number",
    "number.integer": "Limit must be an integer",
    "number.min": "Limit must be at least 1",
    "number.max": "Limit must not exceed 100",
  }),
});
