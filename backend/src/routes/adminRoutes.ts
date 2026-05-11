import { Router } from "express";
import { listFailedTicketsHandler } from "../controllers/adminController";
import { authenticate, requireAdmin } from "../middleware/auth";

const router = Router();

router.use(authenticate, requireAdmin);
router.get("/dlq", listFailedTicketsHandler);

export default router;
