import jwt from "jsonwebtoken";

export const userAuth = (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
      req.userId = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId || null;
    next();
  } catch (error) {
    req.userId = null;
    next();
  }
};
