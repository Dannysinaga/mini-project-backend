import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { VoucherService } from '../services/voucher.service';
import { CreateVoucherDTO, ApplyVoucherDTO } from '../dtos/voucher/voucher.dto';
import { z } from 'zod';

const voucherService = new VoucherService();

// POST /vouchers - Organizer create voucher (hanya ORGANIZER)
export const createVoucher = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId || userRole !== 'ORGANIZER') {
      return res.status(403).json({ success: false, message: 'Only organizers can create vouchers' });
    }

    const validatedData = CreateVoucherDTO.parse(req.body);
    const voucher = await voucherService.createVoucher(userId, validatedData);

    res.status(201).json({ success: true, data: voucher });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, errors: error.issues.map(e => e.message) });
    }
    res.status(400).json({ success: false, message: error instanceof Error ? error.message : 'Error' });
  }
};

// GET /vouchers/event/:eventId - Lihat voucher untuk event
export const getEventVouchers = async (req: AuthRequest, res: Response) => {
  try {
    const eventId = req.params.eventId as string;  // ← FIX: cast ke string
    const vouchers = await voucherService.getEventVouchers(eventId);
    res.json({ success: true, data: vouchers });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// POST /vouchers/validate - Validasi voucher (sebelum transaksi)
export const validateVoucher = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const validatedData = ApplyVoucherDTO.parse(req.body);
    const voucher = await voucherService.validateVoucher(userId, validatedData);

    res.json({ 
      success: true, 
      data: {
        id: voucher.id,
        code: voucher.code,
        discountAmount: voucher.discountAmount
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, errors: error.issues.map(e => e.message) });
    }
    res.status(400).json({ success: false, message: error instanceof Error ? error.message : 'Error' });
  }
};