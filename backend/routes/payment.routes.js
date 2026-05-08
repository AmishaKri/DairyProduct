import express from "express";
import Razorpay from "razorpay";
import crypto from "crypto";

const router = express.Router();

const getRazorpay = () =>
  new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });

// Create Razorpay order
router.post("/create-order", async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ error: "Invalid amount" });

    const razorpay = getRazorpay();
    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // paise
      currency: "INR",
      receipt: `kshira_${Date.now()}`,
    });
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Verify Razorpay payment signature
router.post("/verify", async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const sign = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign)
      .digest("hex");

    if (expected === razorpay_signature) {
      res.json({ success: true, paymentId: razorpay_payment_id });
    } else {
      res.status(400).json({ error: "Payment verification failed" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
