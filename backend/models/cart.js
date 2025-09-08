import mongoose from "mongoose";

const cartSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    items: [
      {
        itemId: { type: mongoose.Schema.Types.ObjectId, ref: "Item", required: true },
        qty: { type: Number, default: 1, min: 1 }
      }
    ]
  },
  { timestamps: true }
);

export default mongoose.model("Cart", cartSchema);
