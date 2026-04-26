import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { createVoucher, getEventVouchers, validateVoucher } from '../controllers/voucher.controller';

const router = Router();


router.use(authMiddleware);

router.post('/', createVoucher);                      // cuman organizer (dari controller)
router.get('/event/:eventId', getEventVouchers);      // user dan organizer bisa lihat
router.post('/validate', validateVoucher);            // Validate before checkout

export default router;