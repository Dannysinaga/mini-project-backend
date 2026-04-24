import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { RegisterDTO } from '../dtos/auth/register.dto';
import { LoginDTO } from '../dtos/auth/login.dto';
import { ERROR_MESSAGES, HTTP_STATUS, SUCCESS_MESSAGES } from '../constants/constants';
import { z } from 'zod';
import { ForgotPasswordDTO } from "../dtos/auth/forgot-password.dto";
import { ResetPasswordDTO } from "../dtos/auth/reset-password.dto";
import { AuthRequest } from '../middleware/auth.middleware';

const authService = new AuthService();

export const register = async (req: Request, res: Response) => {
  try {
    const validatedData = RegisterDTO.parse(req.body);
    const { token, user } = await authService.register(validatedData);

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: SUCCESS_MESSAGES.REGISTER_SUCCESS,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          referralCode: user.referralCode,
          points: user.points,
          createdAt: user.createdAt,
          profile: user.profile
        }
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        errors: error.issues.map((issue: z.ZodIssue) => issue.message)
      });
    }
    
    const message = error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
    const status = message === ERROR_MESSAGES.EMAIL_EXISTS 
      ? HTTP_STATUS.BAD_REQUEST 
      : HTTP_STATUS.INTERNAL_SERVER_ERROR;
    
    res.status(status).json({ success: false, error: message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const validatedData = LoginDTO.parse(req.body);
    const { token, user } = await authService.login(validatedData);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: SUCCESS_MESSAGES.LOGIN_SUCCESS,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          referralCode: user.referralCode,
          points: user.points,
          createdAt: user.createdAt,
          profile: user.profile
        }
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        errors: error.issues.map((issue: z.ZodIssue) => issue.message)
      });
    }
    
    const message = error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
    const status = message === ERROR_MESSAGES.INVALID_CREDENTIALS 
      ? HTTP_STATUS.UNAUTHORIZED 
      : HTTP_STATUS.INTERNAL_SERVER_ERROR;
    
    res.status(status).json({ success: false, error: message });
  }
};

export const forgotPassword = async (req: AuthRequest, res: Response) => {
  try {
    const validatedData = ForgotPasswordDTO.parse(req.body);
    await authService.forgotPassword(validatedData.email);

    return res.status(200).json({
      success: true,
      message: "Reset password email sent successfully",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        errors: error.issues.map((issue: z.ZodIssue) => issue.message),
      });
    }

    return res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : "Error",
    });
  }
};

export const resetPassword = async (req: AuthRequest, res: Response) => {
  try {
    const validatedData = ResetPasswordDTO.parse(req.body);
    await authService.resetPassword(
      validatedData.token,
      validatedData.newPassword
    );

    return res.status(200).json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        errors: error.issues.map((issue: z.ZodIssue) => issue.message),
      });
    }

    return res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : "Error",
    });
  }
};