import mongoose from "mongoose";

const wishlistSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
      default: null,
    },
    sessionId: {
      type: String,
      required: false,
      default: null,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for quick lookups
wishlistSchema.index({ userId: 1, productId: 1 });
wishlistSchema.index({ sessionId: 1, productId: 1 });

export default mongoose.model("Wishlist", wishlistSchema);
