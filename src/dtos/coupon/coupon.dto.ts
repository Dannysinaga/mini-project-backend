import { z } from 'zod';


export const CreateCouponDTO = z.object({
  discountAmount: z.number().min(1000, 'Min discount 1000'),
  validUntil: z.string().datetime(),
  userId: z.string().min(1)
});

export const ApplyCouponDTO = z.object({
  code: z.string().min(1, 'Coupon code is required')
});

export type CreateCouponDTOType = z.infer<typeof CreateCouponDTO>;
export type ApplyCouponDTOType = z.infer<typeof ApplyCouponDTO>;