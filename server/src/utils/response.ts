import { Response } from "express";

export function success<T>(res: Response, data: T, status = 200): Response {
  return res.status(status).json({
    success: true,
    data,
    error: null,
  });
}

export function failure(
  res: Response,
  error: string,
  status = 400,
  data: unknown = null
): Response {
  return res.status(status).json({
    success: false,
    data,
    error,
  });
}
