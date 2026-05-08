import express from "express";
import Coupon from "../models/Coupon.model.js";
import { adminAuth } from "../middleware/auth.js";

const router = express.Router();

// Validate coupon (public) — used at checkout
router.post("/validate", async (req, res) => {
  try {
    const { code, orderTotal } = req.body;
    if (!code) return res.status(400).json({ error: "Coupon code is required" });

    const coupon = await Coupon.findOne({ code: code.toUpperCase().trim() });

    if (!coupon) return res.status(404).json({ error: "Invalid coupon code" });
    if (!coupon.isActive) return res.status(400).json({ error: "This coupon is no longer active" });
    if (coupon.expiresAt && new Date() > coupon.expiresAt)
      return res.status(400).json({ error: "This coupon has expired" });
    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses)
      return res.status(400).json({ error: "This coupon has reached its usage limit" });
    if (orderTotal !== undefined && orderTotal < coupon.minOrderValue)
      return res.status(400).json({ error: `Minimum order value ₹${coupon.minOrderValue} required` });

    const discount =
      coupon.discountType === "percent"
        ? Math.min((orderTotal * coupon.discountValue) / 100, orderTotal)
        : Math.min(coupon.discountValue, orderTotal);

    res.json({
      valid: true,
      coupon: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
      },
      discount: parseFloat(discount.toFixed(2)),
      finalTotal: parseFloat((orderTotal - discount).toFixed(2)),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Apply coupon (increment usedCount) — called on order creation
router.post("/apply", async (req, res) => {
  try {
    const { code } = req.body;
    await Coupon.findOneAndUpdate({ code: code?.toUpperCase() }, { $inc: { usedCount: 1 } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── Admin routes ──────────────────────────────────────────

// Get all coupons
router.get("/", adminAuth, async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json(coupons);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create coupon
router.post("/", adminAuth, async (req, res) => {
  try {
    const { code, discountType, discountValue, minOrderValue, maxUses, expiresAt } = req.body;
    if (!code || !discountValue) return res.status(400).json({ error: "Code and discount value are required" });

    const coupon = new Coupon({ code, discountType, discountValue, minOrderValue, maxUses, expiresAt: expiresAt || null });
    await coupon.save();
    res.status(201).json(coupon);
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ error: "Coupon code already exists" });
    res.status(500).json({ error: error.message });
  }
});

// Toggle coupon active
router.patch("/:id/toggle", adminAuth, async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) return res.status(404).json({ error: "Coupon not found" });
    coupon.isActive = !coupon.isActive;
    await coupon.save();
    res.json(coupon);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete coupon
router.delete("/:id", adminAuth, async (req, res) => {
  try {
    await Coupon.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
