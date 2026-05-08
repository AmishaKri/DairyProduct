import express from "express";
import Product from "../models/Product.model.js";
import { adminAuth } from "../middleware/auth.js";

const router = express.Router();

// Get all products (public)
router.get("/", async (req, res) => {
  try {
    const { category } = req.query;
    const query = category ? { category, inStock: true } : { inStock: true };
    const products = await Product.find(query).sort({ highlighted: -1, createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single product by ID (public)
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create product (admin only)
router.post("/", adminAuth, async (req, res) => {
  try {
    const { name, description, price, category, imageUrl, inStock, discount } = req.body;

    if (!name || !price) {
      return res.status(400).json({ error: "Name and price are required" });
    }

    const product = new Product({
      name,
      description: description || null,
      price,
      category: category || "milk",
      imageUrl: imageUrl || null,
      inStock: inStock !== undefined ? inStock : true,
      discount: discount || 0,
    });

    await product.save();
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update product (admin only)
router.put("/:id", adminAuth, async (req, res) => {
  try {
    const { name, description, price, category, imageUrl, inStock, discount } = req.body;

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      {
        name,
        description,
        price,
        category,
        imageUrl,
        inStock,
        discount: discount !== undefined ? discount : undefined,
      },
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Toggle highlight (admin only)
router.patch("/:id/highlight", adminAuth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });
    product.highlighted = !product.highlighted;
    await product.save();
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete product (admin only)
router.delete("/:id", adminAuth, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
