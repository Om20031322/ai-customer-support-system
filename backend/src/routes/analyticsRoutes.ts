import { Router } from "express";
import { getAnalyticsSummaryHandler } from "../controllers/analyticsController";
import { authenticate } from "../middleware/auth";

const router = Router();

router.get("/summary", authenticate, getAnalyticsSummaryHandler);

export default router;
