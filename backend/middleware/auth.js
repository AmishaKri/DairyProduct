import jwt from "jsonwebtoken";

export const adminAuth = (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "No token provided" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.type !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    req.admin = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid or expired admin token" });
  }
};
