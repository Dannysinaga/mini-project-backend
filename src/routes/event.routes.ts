import { Router } from "express";
import {
  createEvent,
  deleteEvent,
  getEventDetail,
  getEvents,
  getOrganizerEvents,
  updateEvent,
} from "../controllers/event.controller";

const router = Router();

router.post("/", createEvent);
router.get("/", getEvents);
router.get("/organizer/list", getOrganizerEvents);
router.get("/:id", getEventDetail);
router.put("/:id", updateEvent);
router.delete("/:id", deleteEvent);

export default router;