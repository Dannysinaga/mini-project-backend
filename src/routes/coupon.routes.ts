import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { getUserCoupons, applyCoupon } from '../controllers/coupon.controller';

const router = Router();

router.get('/users/coupons', authMiddleware, getUserCoupons);
router.post('/coupons/apply', authMiddleware, applyCoupon);

export default router;