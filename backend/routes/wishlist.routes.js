import express from "express";
import Wishlist from "../models/Wishlist.model.js";
import Product from "../models/Product.model.js";
import { adminAuth } from "../middleware/auth.js";
import { userAuth } from "../middleware/userAuth.js";

const router = express.Router();

// Add product to wishlist (works for both logged-in and guest users)
router.post("/", userAuth, async (req, res) => {
  try {
    const { productId, sessionId } = req.body;
    const userId = req.userId;

    if (!productId) {
      return res.status(400).json({ error: "Product ID is required" });
    }

    // Guest must provide a sessionId
    if (!userId && !sessionId) {
      return res.status(400).json({ error: "sessionId required for guest users" });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Check for duplicate based on userId (logged-in) or sessionId (guest)
    const query = userId ? { userId, productId } : { sessionId, productId, userId: null };
    const existing = await Wishlist.findOne(query);
    if (existing) {
      return res.status(400).json({ error: "Product already in wishlist" });
    }

    const wishlistData = userId
      ? { userId, productId }
      : { sessionId, productId };

    const wishlist = new Wishlist(wishlistData);
    await wishlist.save();
    res.status(201).json(wishlist);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Remove product from wishlist (works for both logged-in and guest users)
router.delete("/:productId", userAuth, async (req, res) => {
  try {
    const userId = req.userId;
    const { sessionId } = req.query;

    if (!userId && !sessionId) {
      return res.status(400).json({ error: "sessionId required for guest users" });
    }

    const query = userId
      ? { userId, productId: req.params.productId }
      : { sessionId, productId: req.params.productId, userId: null };

    const wishlist = await Wishlist.findOneAndDelete(query);

    if (!wishlist) {
      return res.status(404).json({ error: "Wishlist item not found" });
    }

    res.json({ message: "Removed from wishlist" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all wishlist items for the logged-in user
router.get("/", userAuth, async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const wishlists = await Wishlist.find({ userId })
      .populate("productId")
      .sort({ createdAt: -1 });

    const products = wishlists.map((w) => w.productId).filter(Boolean);
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all wishlist items (for admin panel) - returns all wishlist data for authenticated users
router.get("/all", userAuth, async (req, res) => {
  try {
    const wishlists = await Wishlist.find()
      .populate("userId", "email")
      .populate("productId", "name price imageUrl")
      .sort({ createdAt: -1 });

    res.json(wishlists);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all wishlist items (admin only) - for admin panel
router.get("/admin/all", adminAuth, async (req, res) => {
  try {
    const wishlists = await Wishlist.find()
      .populate("userId", "email")
      .populate("productId", "name price imageUrl")
      .sort({ createdAt: -1 });

    res.json(wishlists);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Check if product is in wishlist
router.get("/check/:productId", userAuth, async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.json({ exists: false });
    }

    const wishlist = await Wishlist.findOne({
      userId,
      productId: req.params.productId,
    });

    res.json({ exists: !!wishlist });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
