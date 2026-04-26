import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { createReview, getEventReviews, getOrganizerReviews, deleteReview } from '../controllers/review.controller';

const router = Router();

// Public routes (no auth required for viewing)
router.get('/event/:eventId', getEventReviews);
router.get('/organizer/:organizerId', getOrganizerReviews);

// Protected routes (auth required)
router.use(authMiddleware);
router.post('/', createReview);
router.delete('/:reviewId', deleteReview);

export default router;