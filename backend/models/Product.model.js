import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: null,
    },
    price: {
      type: Number,
      required: true,
    },
    category: {
      type: String,
      enum: ["milk", "dairy"],
      default: "milk",
    },
    imageUrl: {
      type: String,
      default: null,
    },
    inStock: {
      type: Boolean,
      default: true,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    highlighted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Product", productSchema);
