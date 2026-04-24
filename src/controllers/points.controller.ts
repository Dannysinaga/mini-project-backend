import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { PointsService } from "../services/points.service";

const pointsService = new PointsService();

export const getPointsBalance = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const points = await pointsService.getPointsBalance(userId);

    return res.status(200).json({
      success: true,
      message: "Points balance fetched successfully",
      data: points,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Error",
    });
  }
};

export const getPointsHistory = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const history = await pointsService.getPointsHistory(userId);

    return res.status(200).json({
      success: true,
      message: "Points history fetched successfully",
      data: history,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Error",
    });
  }
};