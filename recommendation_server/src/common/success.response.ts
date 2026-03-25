import { HttpStatusCode } from "@/constants/status-code";
import { Response } from "express";

export class AppResponse {
  message: string;
  statusCode: number;
  data: any;
  constructor({
    message,
    statusCode = HttpStatusCode.OK,
    data = {},
  }: {
    message: string;
    statusCode?: number;
    data?: any;
  }) {
    this.message = message;
    this.statusCode = statusCode;
    this.data = data;
  }

  sendResponse(res: Response) {
    return res.status(this.statusCode).json({
      success: true,
      message: this.message,
      data: this.data,
    });
  }
}

/**
 * Helper function to send success responses
 */
export function successResponse(
  res: Response,
  statusCode: number,
  message: string,
  data?: any
): Response {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
  
}
