import { verifyToken } from "../services/tokenService.js";

export const auth = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer "))
    return res.status(401).json({ message: "Unauthorized" });

  const token = header.split(" ")[1];
  const decoded = verifyToken(token);
  if (!decoded) return res.status(401).json({ message: "Invalid token" });

  req.userId = decoded.userId;
  next();
};
