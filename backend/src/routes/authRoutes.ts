import { Router } from "express";
import {
  forgotPasswordHandler,
  googleLoginHandler,
  loginHandler,
  meHandler,
  registerHandler,
  resetPasswordHandler
} from "../controllers/authController";
import { authenticate } from "../middleware/auth";

const router = Router();

// Auth routes
router.post("/register", registerHandler);
router.post("/login", loginHandler);
router.post("/google", googleLoginHandler);

// Password reset routes
router.post("/forgot-password", forgotPasswordHandler);
router.post("/reset-password", resetPasswordHandler);

// Current authenticated user
router.get("/me", authenticate, meHandler);

export default router;