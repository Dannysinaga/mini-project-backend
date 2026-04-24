import { z } from "zod";

export const UpdateProfileDTO = z.object({
  fullname: z.string().min(1, "Fullname is required").optional(),
  phone: z.string().optional(),
  bio: z.string().optional(),
  photoUrl: z.string().optional(),
});

export type UpdateProfileDTOType = z.infer<typeof UpdateProfileDTO>;    