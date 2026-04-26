import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { CouponService } from '../services/coupon.service';
import { ApplyCouponDTO } from '../dtos/coupon/coupon.dto';
import { z } from 'zod';

const couponService = new CouponService();

// GET /users/coupons - Lihat semua coupon user
export const getUserCoupons = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const coupons = await couponService.getUserCoupons(userId);
    res.json({ success: true, data: coupons });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// POST /coupons/apply - Validasi coupon (sebelum transaksi)
export const applyCoupon = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const validatedData = ApplyCouponDTO.parse(req.body);
    const coupon = await couponService.applyCoupon(userId, validatedData);

    res.json({ 
      success: true, 
      data: {
        id: coupon.id,
        code: coupon.code,
        discountAmount: coupon.discountAmount,
        validUntil: coupon.validUntil
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        success: false, 
        errors: error.issues.map((issue: z.ZodIssue) => issue.message) 
      });
    }
    res.status(400).json({ success: false, message: error instanceof Error ? error.message : 'Error' });
  }
};