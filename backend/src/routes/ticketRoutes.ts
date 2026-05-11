import { Router } from "express";
import {
  createTicketHandler,
  getTicketByIdHandler,
  listTicketsHandler,
  updateTicketStatusHandler
} from "../controllers/ticketController";
import { authenticate, requireAdmin } from "../middleware/auth";

const router = Router();

router.use(authenticate);
router.post("/", createTicketHandler);
router.get("/", listTicketsHandler);
router.get("/:id", getTicketByIdHandler);
router.patch("/:id/status", requireAdmin, updateTicketStatusHandler);

export default router;
