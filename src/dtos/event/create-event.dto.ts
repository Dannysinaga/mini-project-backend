import { z } from "zod";

export const CreateEventDTO = z.object({
  organizerId: z.string().min(1, "Organizer id is required"),
  name: z.string().min(1, "Event name is required"),
  description: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  location: z.string().min(1, "Location is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  bannerUrl: z.string().optional(),
  ticketTypes: z
    .array(
      z.object({
        name: z.string().min(1, "Ticket name is required"),
        price: z.number().min(0, "Ticket price must be at least 0"),
        quota: z.number().min(1, "Ticket quota must be at least 1"),
      })
    )
    .optional(),
});

export type CreateEventDTOType = z.infer<typeof CreateEventDTO>;