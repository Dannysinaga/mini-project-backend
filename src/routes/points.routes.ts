import { Router } from "express";
import { getPointsBalance, getPointsHistory } from "../controllers/points.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.get("/balance", authMiddleware, getPointsBalance);
router.get("/history", authMiddleware, getPointsHistory);

export default router;