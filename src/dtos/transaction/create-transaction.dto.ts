import { z } from "zod";

export const CreateTransactionDTO = z.object({
  userId: z.string().min(1, "User id is required"),
  eventId: z.string().min(1, "Event id is required"),
  usedPoints: z.number().min(0, "Used points cannot be negative").optional().default(0),
  items: z
    .array(
      z.object({
        ticketTypeId: z.string().min(1, "Ticket type id is required"),
        quantity: z.number().min(1, "Quantity must be at least 1"),
      })
    )
    .min(1, "At least one ticket item is required"),
});

export type CreateTransactionDTOType = z.infer<typeof CreateTransactionDTO>;