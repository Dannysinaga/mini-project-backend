import { prisma } from '../lib/prisma';
import { CreateReviewDTOType } from '../dtos/review/review.dto';

export class ReviewService {
  // Customer: create review only after attending event
  async createReview(userId: string, data: CreateReviewDTOType) {
    // Check if user already reviewed this event
    const existingReview = await prisma.review.findUnique({
      where: {
        userId_eventId: {
          userId: userId,
          eventId: data.eventId
        }
      }
    });

    if (existingReview) {
      throw new Error('You have already reviewed this event');
    }

    // Check if user has attended the event (transaction status DONE)
    const transaction = await prisma.transaction.findFirst({
      where: {
        userId: userId,
        eventId: data.eventId,
        status: 'DONE'
      }
    });

    if (!transaction) {
      throw new Error('You can only review events you have attended');
    }

    // Check if event has ended
    const event = await prisma.event.findUnique({
      where: { id: data.eventId }
    });

    if (event && new Date(event.endDate) > new Date()) {
      throw new Error('You can only review events that have ended');
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        userId,
        eventId: data.eventId,
        rating: data.rating,
        comment: data.comment
      },
      include: {
        user: {
          include: { profile: true }
        }
      }
    });

    return review;
  }

  // Get all reviews for an event
  async getEventReviews(eventId: string) {
    const reviews = await prisma.review.findMany({
      where: { eventId },
      include: {
        user: {
          include: { profile: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate average rating
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;

    return {
      reviews,
      summary: {
        totalReviews: reviews.length,
        averageRating: parseFloat(averageRating.toFixed(1))
      }
    };
  }

  // Get organizer's reviews (for organizer profile)
  async getOrganizerReviews(organizerId: string) {
    const reviews = await prisma.review.findMany({
      where: {
        event: {
          organizerId: organizerId
        }
      },
      include: {
        user: {
          include: { profile: true }
        },
        event: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;

    return {
      reviews,
      summary: {
        totalReviews: reviews.length,
        averageRating: parseFloat(averageRating.toFixed(1))
      }
    };
  }

  // Delete review (user can delete their own review)
  async deleteReview(userId: string, reviewId: string) {
    const review = await prisma.review.findFirst({
      where: { id: reviewId, userId }
    });

    if (!review) {
      throw new Error('Review not found or unauthorized');
    }

    await prisma.review.delete({ where: { id: reviewId } });
    return true;
  }
}