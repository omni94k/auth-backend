import express from "express";
import {
  signup,
  login,
  refresh,
  logout
} from "../controllers/authController.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", logout);

// protected example
router.get("/profile", auth, (req, res) => {
  res.json({ message: "Protected route accessed", userId: req.userId });
});

export default router;
