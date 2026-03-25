

import { ErrorCode } from "@/constants/error-code";
import { HttpStatusCode } from "@/constants/status-code";
import { AppError } from "@/common/error.response";
import { NextFunction, Request, Response } from "express";
import { logger } from "@/utils/logger";
import { ErrorMessages } from "@/constants/message";

export const exceptionHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const status = err.statusCode || HttpStatusCode.INTERNAL_SERVER_ERROR;
  const errorCode = err.errorCode! || ErrorCode.INTERNAL_SERVER_ERROR;

  logger.error(err.message);

  const fallbackMessage = ErrorMessages.SERVER.SERVER_ERROR;
  const message = err.message || fallbackMessage;
  const safeMessageMap: Record<string, string> = {
    [ErrorCode.CART_NOT_FOUND]: ErrorMessages.CART.CART_NOT_FOUND,
    [ErrorCode.CART_ITEM_NOT_FOUND]: ErrorMessages.CART.CART_ITEM_NOT_FOUND,
    [ErrorCode.CART_IS_EMPTY]: ErrorMessages.CART.CART_IS_EMPTY,
    [ErrorCode.ITEM_ALREADY_IN_CART]: ErrorMessages.CART.ITEM_ALREADY_IN_CART,
    [ErrorCode.CART_QUANTITY_EXCEEDED]: ErrorMessages.CART.CART_QUANTITY_EXCEEDED,
    [ErrorCode.VALIDATION_ERROR]: ErrorMessages.VALIDATION.VALIDATION_ERROR,
    [ErrorCode.PRODUCT_NOT_FOUND]: ErrorMessages.PRODUCT.PRODUCT_NOT_FOUND,
    [ErrorCode.FORBIDDEN]: ErrorMessages.AUTH.FORBIDDEN,
    [ErrorCode.UNAUTHORIZED]: ErrorMessages.AUTH.UNAUTHORIZED,
  };

  res.status(status).json({
    success: false,
    message: safeMessageMap[errorCode] || message || fallbackMessage,
    statusCode: status,
    errorCode: errorCode,
    details: err.details || {},
  });
};
