import { Response } from "express";

export class AppError extends Error {
  statusCode: number;
  errorCode: string;
  details: any;

  constructor(
    message: string,
    statusCode: number,
    errorCode: string,
    details?: any
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
  }
}

/**
 * Helper function to send error responses
 */
export function errorResponse(
  res: Response,
  statusCode: number,
  message: string,
  errorCode?: string,
  details?: any
): Response {
  return res.status(statusCode).json({
    success: false,
    message,
    errorCode,
    details,
  });
}
