import { prisma } from "../lib/prisma";
import type { CreateTransactionDTOType } from "../dtos/transaction/create-transaction.dto";

export class TransactionService {
  async createTransaction(data: CreateTransactionDTOType) {
    const { userId, eventId, items } = data;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        ticketTypes: true,
      },
    });

    if (!event) {
      throw new Error("Event not found");
    }

    let totalAmount = 0;

    const normalizedItems = items.map(
      (item: CreateTransactionDTOType["items"][number]) => {
        const ticket = event.ticketTypes.find((t) => t.id === item.ticketTypeId);

        if (!ticket) {
          throw new Error("Ticket type not found in this event");
        }

        if (ticket.availableQuota < item.quantity) {
          throw new Error(`Not enough quota for ticket ${ticket.name}`);
        }

        const subtotal = ticket.price * item.quantity;
        totalAmount += subtotal;

        return {
          ticketTypeId: ticket.id,
          quantity: item.quantity,
          price: ticket.price,
          subtotal,
        };
      }
    );

    const paymentDeadlineAt = new Date(Date.now() + 2 * 60 * 60 * 1000);

    const transaction = await prisma.$transaction(async (tx) => {
      const createdTransaction = await tx.transaction.create({
        data: {
          userId,
          eventId,
          totalAmount,
          finalAmount: totalAmount,
          status: "WAITING_PAYMENT",
          paymentDeadlineAt,
          items: {
            create: normalizedItems,
          },
        },
        include: {
          items: true,
          event: true,
          user: {
            include: {
              profile: true,
            },
          },
        },
      });

      for (const item of normalizedItems) {
        await tx.ticketType.update({
          where: { id: item.ticketTypeId },
          data: {
            availableQuota: {
              decrement: item.quantity,
            },
          },
        });
      }

      return createdTransaction;
    });

    return transaction;
  }

  async getTransactionHistory(userId: string) {
    if (!userId) {
      throw new Error("userId query is required");
    }

    return prisma.transaction.findMany({
      where: { userId },
      include: {
        event: true,
        items: {
          include: {
            ticketType: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }
}