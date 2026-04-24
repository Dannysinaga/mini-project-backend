import { z } from "zod";

export const ForgotPasswordDTO = z.object({
  email: z.string().email("Email is invalid"),
});

export type ForgotPasswordDTOType = z.infer<typeof ForgotPasswordDTO>;