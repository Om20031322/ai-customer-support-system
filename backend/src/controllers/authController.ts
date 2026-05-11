import { NextFunction, Request, Response } from "express";
import { AppError } from "../middleware/errorHandler";
import {
  getCurrentUser,
  loginUser,
  loginWithGoogle,
  registerUser,
  requestPasswordReset,
  resetPassword
} from "../services/authService";

export async function registerHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const result = await registerUser(req.body);
    res.status(201).json({ data: result });
  } catch (error) {
    next(error);
  }
}

export async function loginHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const result = await loginUser(req.body);
    res.status(200).json({ data: result });
  } catch (error) {
    next(error);
  }
}

export async function googleLoginHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const result = await loginWithGoogle(req.body);
    res.status(200).json({ data: result });
  } catch (error) {
    next(error);
  }
}

export async function forgotPasswordHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const result = await requestPasswordReset(req.body);
    res.status(200).json({ data: result });
  } catch (error) {
    next(error);
  }
}

export async function resetPasswordHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const result = await resetPassword(req.body);
    res.status(200).json({ data: result });
  } catch (error) {
    next(error);
  }
}

export async function meHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) {
      throw new AppError("Authentication token is required", 401);
    }

    const user = await getCurrentUser(req.user.id);
    res.status(200).json({ data: user });
  } catch (error) {
    next(error);
  }
}