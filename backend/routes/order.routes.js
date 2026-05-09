import express from "express";
import Order from "../models/Order.model.js";
import { adminAuth } from "../middleware/auth.js";
import { userAuth } from "../middleware/userAuth.js";

const router = express.Router();

// Create order (public or authenticated)
router.post("/", userAuth, async (req, res) => {
  try {
    const {
      customerName,
      customerPhone,
      customerAddress,
      items,
      total,
      paymentMethod,
      transactionId,
      paymentStatus,
      razorpayOrderId,
      razorpayPaymentId,
    } = req.body;

    if (!customerName || !customerPhone || !customerAddress || !items || !total || !paymentMethod) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const order = new Order({
      customerName,
      customerPhone,
      customerAddress,
      items,
      total,
      paymentMethod,
      transactionId: transactionId || null,
      paymentStatus: paymentStatus || "pending",
      razorpayOrderId: razorpayOrderId || null,
      razorpayPaymentId: razorpayPaymentId || null,
      userId: req.userId || null,
    });

    await order.save();
    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all orders (admin only)
router.get("/", adminAuth, async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get order by ID (admin only)
router.get("/:id", adminAuth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update order status (admin only)
router.patch("/:id/status", adminAuth, async (req, res) => {
  try {
    const { status } = req.body;

    if (!["pending", "confirmed", "delivered", "cancelled"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update payment status (public - called after Razorpay payment)
router.patch("/:id/payment", async (req, res) => {
  try {
    const { paymentStatus, transactionId, razorpayPaymentId, razorpayOrderId } = req.body;

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      {
        paymentStatus: paymentStatus || "completed",
        transactionId: transactionId || null,
        razorpayPaymentId: razorpayPaymentId || null,
        razorpayOrderId: razorpayOrderId || null,
      },
      { new: true, runValidators: true }
    );

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
