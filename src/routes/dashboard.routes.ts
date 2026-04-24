import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { roleMiddleware } from '../middleware/roleMiddleware';
import {
  getStats,
  getChartData,
  getAttendees,
  getMyEvents,
  updateEvent,
  deleteEvent,
} from '../controllers/dashboard.controller';

const router = Router();

// Semua route dashboard hanya untuk ORGANIZER
router.use(authMiddleware);
router.use(roleMiddleware(['ORGANIZER']));

router.get('/stats', getStats);
router.get('/chart', getChartData);
router.get('/events', getMyEvents);
router.get('/attendees/:eventId', getAttendees);
router.put('/events/:eventId', updateEvent);
router.delete('/events/:eventId', deleteEvent);

export default router;