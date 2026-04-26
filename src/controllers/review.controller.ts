import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { ReviewService } from '../services/review.service';
import { CreateReviewDTO } from '../dtos/review/review.dto';
import { z } from 'zod';

const reviewService = new ReviewService();

// POST /reviews - Create review (customer only)
export const createReview = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const validatedData = CreateReviewDTO.parse(req.body);
    const review = await reviewService.createReview(userId, validatedData);

    res.status(201).json({ success: true, data: review });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, errors: error.issues.map(e => e.message) });
    }
    res.status(400).json({ success: false, message: error instanceof Error ? error.message : 'Error' });
  }
};

// GET /reviews/event/:eventId - Get all reviews for an event
export const getEventReviews = async (req: AuthRequest, res: Response) => {
  try {
    const eventId = req.params.eventId as string;
    const data = await reviewService.getEventReviews(eventId);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// GET /reviews/organizer/:organizerId - Get organizer's reviews
export const getOrganizerReviews = async (req: AuthRequest, res: Response) => {
  try {
    const organizerId = req.params.organizerId as string;
    const data = await reviewService.getOrganizerReviews(organizerId);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// DELETE /reviews/:reviewId - Delete own review
export const deleteReview = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const reviewId = req.params.reviewId as string;
    await reviewService.deleteReview(userId, reviewId);
    res.json({ success: true, message: 'Review deleted successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error instanceof Error ? error.message : 'Error' });
  }
};