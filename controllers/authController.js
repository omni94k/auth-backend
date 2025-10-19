import User from "../models/User.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyToken
} from "../services/tokenService.js";
import bcrypt from "bcrypt";

let refreshTokens = []; // store in DB or Redis in production

// SIGNUP
export const signup = async (req, res) => {
  try {
    const { email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing)
      return res.status(400).json({ message: "Email already registered" });

    // Fix: use save() to trigger pre-save hook
    const user = new User({ email, password });
    await user.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    res.status(500).json({ message: "Signup failed", error: err.message });
  }
};

// LOGIN
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: "Invalid password" });

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    refreshTokens.push(refreshToken);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: parseInt(process.env.REFRESH_TOKEN_EXPIRES) * 1000
    });

   res.json({
  accessToken,
  refreshToken,   // send refresh token to frontend
  user: { id: user._id, email: user.email }
});
  } catch (err) {
    res.status(500).json({ message: "Login failed", error: err.message });
  }
};

// REFRESH TOKEN
export const refresh = (req, res) => {
  const { refreshToken } = req.cookies;
  if (!refreshToken || !refreshTokens.includes(refreshToken))
    return res.status(403).json({ message: "Invalid refresh token" });

  const decoded = verifyToken(refreshToken);
  if (!decoded) return res.status(403).json({ message: "Invalid token" });

  const accessToken = generateAccessToken(decoded.userId);
  res.json({ accessToken });
};

// LOGOUT
export const logout = (req, res) => {
  const { refreshToken } = req.cookies;
  refreshTokens = refreshTokens.filter((t) => t !== refreshToken);
  res.clearCookie("refreshToken");
  res.json({ message: "Logged out successfully" });
};
