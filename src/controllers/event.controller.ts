import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { CreateEventDTO } from "../dtos/event/create-event.dto";

export const createEvent = async (req: Request, res: Response) => {
  try {
    const validatedData = CreateEventDTO.parse(req.body);

    const {
      organizerId,
      name,
      description,
      category,
      location,
      startDate,
      endDate,
      bannerUrl,
      ticketTypes,
    } = validatedData;

    const organizer = await prisma.user.findUnique({
      where: { id: organizerId },
    });

    if (!organizer) {
      return res.status(404).json({
        success: false,
        message: "Organizer not found",
      });
    }

    if (organizer.role !== "ORGANIZER") {
      return res.status(400).json({
        success: false,
        message: "Selected user is not an organizer",
      });
    }

    const parsedStartDate = new Date(startDate);
    const parsedEndDate = new Date(endDate);

    if (parsedEndDate <= parsedStartDate) {
      return res.status(400).json({
        success: false,
        message: "endDate must be later than startDate",
      });
    }

    const event = await prisma.event.create({
      data: {
        organizerId,
        name,
        description,
        category,
        location,
        bannerUrl,
        startDate: parsedStartDate,
        endDate: parsedEndDate,
        status: "PUBLISHED",
        ticketTypes: {
          create:
            Array.isArray(ticketTypes) && ticketTypes.length > 0
              ? ticketTypes.map((ticket) => ({
                  name: ticket.name,
                  price: Number(ticket.price),
                  quota: Number(ticket.quota),
                  availableQuota: Number(ticket.quota),
                }))
              : [],
        },
      },
      include: {
        ticketTypes: true,
        organizer: {
          include: {
            profile: true,
          },
        },
      },
    });

    return res.status(201).json({
      success: true,
      message: "Event created successfully",
      data: event,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        errors: error.issues.map((issue) => issue.message),
      });
    }

    console.error("CREATE EVENT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getEvents = async (req: Request, res: Response) => {
  try {
    const search = (req.query.search as string | undefined)?.trim();
    const category = (req.query.category as string | undefined)?.trim();
    const location = (req.query.location as string | undefined)?.trim();

    const events = await prisma.event.findMany({
      where: {
        deletedAt: null,
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
        ...(category
          ? {
              category: { contains: category, mode: "insensitive" },
            }
          : {}),
        ...(location
          ? {
              location: { contains: location, mode: "insensitive" },
            }
          : {}),
      },
      include: {
        ticketTypes: true,
        organizer: {
          include: {
            profile: true,
          },
        },
      },
      orderBy: {
        startDate: "asc",
      },
    });

    return res.status(200).json({
      success: true,
      message: "Events fetched successfully",
      data: events,
    });
  } catch (error) {
    console.error("GET EVENTS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getEventDetail = async (req: Request, res: Response) => {
  try {
    const eventId = req.params.id as string;

    if (!eventId) {
      return res.status(400).json({
        success: false,
        message: "Event id is required",
      });
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        ticketTypes: true,
        organizer: {
          include: {
            profile: true,
          },
        },
      },
    });

    if (!event || event.deletedAt) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Event detail fetched successfully",
      data: event,
    });
  } catch (error) {
    console.error("GET EVENT DETAIL ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getOrganizerEvents = async (req: Request, res: Response) => {
  try {
    const organizerId = req.query.organizerId as string | undefined;

    if (!organizerId) {
      return res.status(400).json({
        success: false,
        message: "organizerId query is required",
      });
    }

    const events = await prisma.event.findMany({
      where: {
        organizerId,
        deletedAt: null,
      },
      include: {
        ticketTypes: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      message: "Organizer events fetched successfully",
      data: events,
    });
  } catch (error) {
    console.error("GET ORGANIZER EVENTS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const updateEvent = async (req: Request, res: Response) => {
  try {
    const eventId = req.params.id as string;
    const validatedData = CreateEventDTO.parse(req.body);

    const existingEvent = await prisma.event.findUnique({
      where: { id: eventId },
      include: { ticketTypes: true },
    });

    if (!existingEvent || existingEvent.deletedAt) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    const {
      organizerId,
      name,
      description,
      category,
      location,
      startDate,
      endDate,
      bannerUrl,
      ticketTypes,
    } = validatedData;

    if (existingEvent.organizerId !== organizerId) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to update this event",
      });
    }

    const parsedStartDate = new Date(startDate);
    const parsedEndDate = new Date(endDate);

    if (parsedEndDate <= parsedStartDate) {
      return res.status(400).json({
        success: false,
        message: "endDate must be later than startDate",
      });
    }

    const updatedEvent = await prisma.$transaction(async (tx) => {
      await tx.ticketType.deleteMany({
        where: { eventId },
      });

      return tx.event.update({
        where: { id: eventId },
        data: {
          name,
          description,
          category,
          location,
          startDate: parsedStartDate,
          endDate: parsedEndDate,
          bannerUrl,
          ticketTypes: {
            create:
              Array.isArray(ticketTypes) && ticketTypes.length > 0
                ? ticketTypes.map((ticket) => ({
                    name: ticket.name,
                    price: Number(ticket.price),
                    quota: Number(ticket.quota),
                    availableQuota: Number(ticket.quota),
                  }))
                : [],
          },
        },
        include: {
          ticketTypes: true,
          organizer: {
            include: {
              profile: true,
            },
          },
        },
      });
    });

    return res.status(200).json({
      success: true,
      message: "Event updated successfully",
      data: updatedEvent,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        errors: error.issues.map((issue) => issue.message),
      });
    }

    console.error("UPDATE EVENT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const deleteEvent = async (req: Request, res: Response) => {
  try {
    const eventId = req.params.id as string;
    const organizerId = req.query.organizerId as string | undefined;

    if (!organizerId) {
      return res.status(400).json({
        success: false,
        message: "organizerId query is required",
      });
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event || event.deletedAt) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    if (event.organizerId !== organizerId) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to delete this event",
      });
    }

    const deletedEvent = await prisma.event.update({
      where: { id: eventId },
      data: {
        deletedAt: new Date(),
      },
    });

    return res.status(200).json({
      success: true,
      message: "Event deleted successfully",
      data: deletedEvent,
    });
  } catch (error) {
    console.error("DELETE EVENT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};