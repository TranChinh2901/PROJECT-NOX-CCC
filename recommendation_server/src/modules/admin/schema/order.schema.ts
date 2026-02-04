import Joi from 'joi';
import { paginationQuerySchema } from './pagination-query.schema';
import { OrderStatus, PaymentStatus } from '@/modules/orders/enum/order.enum';

export const orderFilterQuerySchema = paginationQuerySchema.keys({
  status: Joi.string()
    .valid(...Object.values(OrderStatus))
    .optional()
    .messages({
      'any.only': `Status must be one of: ${Object.values(OrderStatus).join(', ')}`,
    }),
  payment_status: Joi.string()
    .valid(...Object.values(PaymentStatus))
    .optional()
    .messages({
      'any.only': `Payment status must be one of: ${Object.values(PaymentStatus).join(', ')}`,
    }),
  user_id: Joi.number()
    .integer()
    .positive()
    .optional()
    .messages({
      'number.base': 'User ID must be a number',
      'number.integer': 'User ID must be an integer',
      'number.positive': 'User ID must be positive',
    }),
  start_date: Joi.date()
    .iso()
    .optional()
    .messages({
      'date.base': 'Start date must be a valid date',
      'date.format': 'Start date must be in ISO 8601 format',
    }),
  end_date: Joi.date()
    .iso()
    .min(Joi.ref('start_date'))
    .optional()
    .messages({
      'date.base': 'End date must be a valid date',
      'date.format': 'End date must be in ISO 8601 format',
      'date.min': 'End date must be after start date',
    }),
});

export const updateOrderStatusSchema = Joi.object({
  status: Joi.string()
    .valid(...Object.values(OrderStatus))
    .required()
    .messages({
      'any.required': 'Status is required',
      'any.only': `Status must be one of: ${Object.values(OrderStatus).join(', ')}`,
    }),
  notes: Joi.string()
    .max(1000)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Notes must not exceed 1000 characters',
    }),
});

export const addInternalNoteSchema = Joi.object({
  note: Joi.string()
    .required()
    .min(1)
    .max(1000)
    .messages({
      'any.required': 'Note is required',
      'string.empty': 'Note cannot be empty',
      'string.min': 'Note must not be empty',
      'string.max': 'Note must not exceed 1000 characters',
    }),
});
