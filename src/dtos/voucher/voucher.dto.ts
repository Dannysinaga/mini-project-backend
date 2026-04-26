import { z } from 'zod';

// Create voucher (organizer only)
export const CreateVoucherDTO = z.object({
  eventId: z.string().min(1, 'Event id is required'),
  code: z.string().min(3, 'Code must be at least 3 characters'),
  discountAmount: z.number().min(1000, 'Min discount 1000'),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  quota: z.number().min(1).optional()
});

// Apply voucher to transaction
export const ApplyVoucherDTO = z.object({
  code: z.string().min(1, 'Voucher code is required'),
  eventId: z.string().min(1, 'Event id is required')
});

export type CreateVoucherDTOType = z.infer<typeof CreateVoucherDTO>;
export type ApplyVoucherDTOType = z.infer<typeof ApplyVoucherDTO>;