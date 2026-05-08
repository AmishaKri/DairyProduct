import express from "express";
import jwt from "jsonwebtoken";
import passport from "../config/passport.js";

const router = express.Router();

// ── Google OAuth ───────────────────────────────

// Initiate Google login
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// Google callback — redirects back to frontend with token
router.get(
  "/google/callback",
  (req, res, next) => {
    passport.authenticate("google", { session: false, failureRedirect: "/api/auth/google/failure" }, (err, user, info) => {
      if (err) {
        console.error("Google OAuth Error:", err);
        return res.redirect(`${process.env.FRONTEND_URL}/oauth-login?error=${encodeURIComponent(err.message || 'OAuth failed')}`);
      }
      if (!user) {
        console.error("Google OAuth: No user returned");
        return res.redirect(`${process.env.FRONTEND_URL}/oauth-login?error=No user returned from Google`);
      }
      req.user = user;
      next();
    })(req, res, next);
  },
  (req, res) => {
    try {
      const token = req.user?.token;
      if (!token) {
        return res.redirect(`${process.env.FRONTEND_URL}/oauth-callback?error=auth_failed`);
      }
      return res.redirect(`${process.env.FRONTEND_URL}/oauth-callback?token=${encodeURIComponent(token)}`);
    } catch (error) {
      console.error("OAuth callback error:", error);
      return res.redirect(`${process.env.FRONTEND_URL}/oauth-callback?error=server_error`);
    }
  }
);

// Failure fallback
router.get("/google/failure", (req, res) => {
  res.redirect(`${process.env.FRONTEND_URL || "http://localhost:8080"}/oauth-login?error=Google+authentication+failed`);
});

// Admin login — hardcoded credentials from .env, no DB lookup
router.post("/admin-login", (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ error: "Username and password are required" });

    if (
      username !== process.env.ADMIN_USERNAME ||
      password !== process.env.ADMIN_PASSWORD
    ) {
      return res.status(401).json({ error: "Invalid admin credentials" });
    }

    const token = jwt.sign(
      { type: "admin", username },
      process.env.JWT_SECRET,
      { expiresIn: "12h" }
    );

    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
