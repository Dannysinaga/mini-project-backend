import { prisma } from '../lib/prisma';
import { ApplyCouponDTOType } from '../dtos/coupon/coupon.dto';

export class CouponService {
  async getUserCoupons(userId: string) {
    return prisma.coupon.findMany({
      where: { userId },
      orderBy: { validUntil: 'asc' }
    });
  }

  async applyCoupon(userId: string, data: ApplyCouponDTOType) {
    const coupon = await prisma.coupon.findFirst({
      where: {
        code: data.code,
        userId: userId,
        isUsed: false,
        validUntil: { gt: new Date() }
      }
    });

    if (!coupon) {
      throw new Error('Invalid or expired coupon');
    }

    return coupon;
  }

  async useCoupon(couponId: string, transactionId: string) {
    return prisma.coupon.update({
      where: { id: couponId },
      data: { isUsed: true, usedAt: new Date() }
    });
  }
}