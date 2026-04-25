import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

export const createTransaction = async (req: Request, res: Response) => {
  try {
    const { userId, eventId, items } = req.body;

    if (!userId || !eventId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "userId, eventId, and items are required",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        ticketTypes: true,
      },
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    let totalAmount = 0;

    const normalizedItems = items.map(
      (item: { ticketTypeId: string; quantity: number }) => {
        const ticket = event.ticketTypes.find((t) => t.id === item.ticketTypeId);

        if (!ticket) {
          throw new Error(`Ticket type ${item.ticketTypeId} not found in this event`);
        }

        if (item.quantity <= 0) {
          throw new Error(`Quantity for ticket ${ticket.name} must be greater than 0`);
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

    return res.status(201).json({
      success: true,
      message: "Transaction created successfully",
      data: transaction,
    });
  } catch (error) {
    console.error("CREATE TRANSACTION ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Internal server error",
    });
  }
};

export const getTransactionHistory = async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string | undefined;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId query is required",
      });
    }

    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
      },
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

    return res.status(200).json({
      success: true,
      message: "Transaction history fetched successfully",
      data: transactions,
    });
  } catch (error) {
    console.error("GET TRANSACTION HISTORY ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const uploadPaymentProof = async (req: Request, res: Response) => {
  try {
    const transactionId = req.params.id as string;
    const { paymentProofUrl } = req.body;

    if (!transactionId) {
      return res.status(400).json({
        success: false,
        message: "Transaction id is required",
      });
    }

    if (!paymentProofUrl) {
      return res.status(400).json({
        success: false,
        message: "paymentProofUrl is required",
      });
    }

    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    const updatedTransaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        paymentProofUrl,
        paymentUploadedAt: new Date(),
      },
    });

    return res.status(200).json({
      success: true,
      message: "Payment proof uploaded successfully",
      data: updatedTransaction,
    });
  } catch (error) {
    console.error("UPLOAD PAYMENT PROOF ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getPendingTransactions = async (req: Request, res: Response) => {
  try {
    const organizerId = req.query.organizerId as string | undefined;

    if (!organizerId) {
      return res.status(400).json({
        success: false,
        message: "organizerId query is required",
      });
    }

    const transactions = await prisma.transaction.findMany({
      where: {
        status: "WAITING_PAYMENT",
        event: {
          organizerId,
        },
        paymentProofUrl: {
          not: null,
        },
      },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
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

    return res.status(200).json({
      success: true,
      message: "Pending transactions fetched successfully",
      data: transactions,
    });
  } catch (error) {
    console.error("GET PENDING TRANSACTIONS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const approveTransaction = async (req: Request, res: Response) => {
  try {
    const transactionId = req.params.id as string;

    if (!transactionId) {
      return res.status(400).json({
        success: false,
        message: "Transaction id is required",
      });
    }

    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    const updatedTransaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status: "DONE",
        confirmationDeadlineAt: new Date(),
        rejectionReason: null,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Transaction approved successfully",
      data: updatedTransaction,
    });
  } catch (error) {
    console.error("APPROVE TRANSACTION ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const rejectTransaction = async (req: Request, res: Response) => {
  try {
    const transactionId = req.params.id as string;
    const { rejectionReason } = req.body;

    if (!transactionId) {
      return res.status(400).json({
        success: false,
        message: "Transaction id is required",
      });
    }

    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    const transactionItems = await prisma.transactionItem.findMany({
      where: { transactionId },
    });

    const updatedTransaction = await prisma.$transaction(async (tx) => {
      const rejectedTransaction = await tx.transaction.update({
        where: { id: transactionId },
        data: {
          status: "REJECTED",
          rejectionReason: rejectionReason || "Payment rejected by organizer",
        },
      });

      for (const item of transactionItems) {
        await tx.ticketType.update({
          where: { id: item.ticketTypeId },
          data: {
            availableQuota: {
              increment: item.quantity,
            },
          },
        });
      }

      return rejectedTransaction;
    });

    return res.status(200).json({
      success: true,
      message: "Transaction rejected successfully",
      data: updatedTransaction,
    });
  } catch (error) {
    console.error("REJECT TRANSACTION ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};