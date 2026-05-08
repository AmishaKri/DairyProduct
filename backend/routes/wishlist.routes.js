import express from "express";
import Wishlist from "../models/Wishlist.model.js";
import Product from "../models/Product.model.js";
import { adminAuth } from "../middleware/auth.js";

const router = express.Router();

// Add product to wishlist
router.post("/", async (req, res) => {
  try {
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ error: "Product ID is required" });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    const existingWishlist = await Wishlist.findOne({
      productId,
    });

    if (existingWishlist) {
      return res.status(400).json({ error: "Product already in wishlist" });
    }

    const wishlist = new Wishlist({
      productId,
    });

    await wishlist.save();
    res.status(201).json(wishlist);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Remove product from wishlist
router.delete("/:productId", async (req, res) => {
  try {
    const wishlist = await Wishlist.findOneAndDelete({
      productId: req.params.productId,
    });

    if (!wishlist) {
      return res.status(404).json({ error: "Wishlist item not found" });
    }

    res.json({ message: "Removed from wishlist" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all wishlist items
router.get("/", async (req, res) => {
  try {
    const wishlists = await Wishlist.find()
      .populate("productId")
      .sort({ createdAt: -1 });

    const products = wishlists.map((w) => w.productId);
    res.json(products);
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

// Check if product is in wishlist (public endpoint)
router.get("/check/:productId", async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({
      productId: req.params.productId,
    });

    res.json({ exists: !!wishlist });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
