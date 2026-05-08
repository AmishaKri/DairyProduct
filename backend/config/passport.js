import dotenv from "dotenv";
dotenv.config();

import passport from "passport";
import GoogleStrategy from "passport-google-oauth20";
import User from "../models/User.model.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

// Only configure Google OAuth if credentials are set
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) return done(new Error("No email from Google profile"));

          let user = await User.findOne({ email });
          if (!user) {
            user = new User({
              email,
              displayName: profile.displayName || email.split("@")[0],
              password: await bcrypt.hash(Math.random().toString(36).slice(-8), 10), // random password
              role: "user",
            });
            await user.save();
          }

          const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
            expiresIn: "7d",
          });

          return done(null, { user, token });
        } catch (error) {
          return done(error);
        }
      }
    )
  );
}

export default passport;
