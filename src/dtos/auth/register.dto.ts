import { z } from 'zod';
import { ERROR_MESSAGES } from '../../constants/constants';

export const RegisterDTO = z.object({
  email: z.string()
    .min(1, ERROR_MESSAGES.EMAIL_REQUIRED)
    .email(ERROR_MESSAGES.INVALID_EMAIL),
  password: z.string()
    .min(1, ERROR_MESSAGES.PASSWORD_REQUIRED)
    .min(6, ERROR_MESSAGES.PASSWORD_MIN_LENGTH),
  fullname: z.string().optional(), 
  phone: z.string().optional(),
  referralCode: z.string().optional()
}); 

export type RegisterDTOType = z.infer<typeof RegisterDTO>;