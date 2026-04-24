import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import {
  getProfile,
  updateProfile,
  changePassword
} from '../controllers/userController';

const router = Router();


router.use(authMiddleware);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.put('/change-password', changePassword);

export default router;