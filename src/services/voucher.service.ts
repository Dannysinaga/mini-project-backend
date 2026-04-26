import { prisma } from '../lib/prisma';
import { CreateVoucherDTOType, ApplyVoucherDTOType } from '../dtos/voucher/voucher.dto';

export class VoucherService {
  // Organizer: create voucher for their event
  async createVoucher(organizerId: string, data: CreateVoucherDTOType) {
    // Verify event belongs to organizer
    const event = await prisma.event.findFirst({
      where: { id: data.eventId, organizerId }
    });

    if (!event) {
      throw new Error('Event not found or unauthorized');
    }

    const voucher = await prisma.voucher.create({
      data: {
        eventId: data.eventId,
        code: data.code.toUpperCase(),
        discountAmount: data.discountAmount,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        quota: data.quota || null
      }
    });

    return voucher;
  }

  // Get all vouchers for an event
  async getEventVouchers(eventId: string) {
    return prisma.voucher.findMany({
      where: { eventId },
      orderBy: { createdAt: 'desc' }
    });
  }

  // Validate voucher before transaction
  async validateVoucher(userId: string, data: ApplyVoucherDTOType) {
    const voucher = await prisma.voucher.findFirst({
      where: {
        code: data.code.toUpperCase(),
        eventId: data.eventId,
        startDate: { lte: new Date() },
        endDate: { gte: new Date() }
      }
    });

    if (!voucher) {
      throw new Error('Invalid or expired voucher');
    }

    // Check quota if set
    if (voucher.quota && voucher.usedCount >= voucher.quota) {
      throw new Error('Voucher quota exhausted');
    }

    return voucher;
  }

  // Use voucher (called when transaction is created)
  async useVoucher(voucherId: string) {
    return prisma.voucher.update({
      where: { id: voucherId },
      data: { usedCount: { increment: 1 } }
    });
  }
}