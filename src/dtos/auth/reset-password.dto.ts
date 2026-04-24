import { z } from "zod";

export const ResetPasswordDTO = z.object({
  token: z.string().min(1, "Token is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
});

export type ResetPasswordDTOType = z.infer<typeof ResetPasswordDTO>;