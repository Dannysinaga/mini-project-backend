import { z } from 'zod';
import { ERROR_MESSAGES } from '../../constants/constants';

export const LoginDTO = z.object({
  email: z.string()
    .min(1, ERROR_MESSAGES.EMAIL_REQUIRED)
    .email(ERROR_MESSAGES.INVALID_EMAIL),
  password: z.string()
    .min(1, ERROR_MESSAGES.PASSWORD_REQUIRED)
});

export type LoginDTOType = z.infer<typeof LoginDTO>;