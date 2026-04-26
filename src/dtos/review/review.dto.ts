import { z } from 'zod';

// Create review (customer only, after attending event)
export const CreateReviewDTO = z.object({
  eventId: z.string().min(1, 'Event id is required'),
  rating: z.number().min(1).max(5, 'Rating must be between 1 and 5'),
  comment: z.string().optional()
});

export type CreateReviewDTOType = z.infer<typeof CreateReviewDTO>;