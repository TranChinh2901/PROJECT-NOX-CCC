import Joi from "joi";

export const bulkOperationSchema = Joi.object({
  ids: Joi.array()
    .items(Joi.number().integer().positive())
    .min(1)
    .max(100)
    .required()
    .messages({
      "array.base": "IDs must be an array",
      "array.min": "At least one ID is required",
      "array.max": "Cannot process more than 100 items at once",
      "any.required": "IDs are required",
      "number.base": "Each ID must be a number",
      "number.integer": "Each ID must be an integer",
      "number.positive": "Each ID must be a positive number",
    }),
});
