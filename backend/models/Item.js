import mongoose from "mongoose";

const itemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, enum: ["clothing", "home", "electronics", "sports", "books"] },
    price: { type: Number, required: true, min: 0 },
    image: { type: String, default: "" },
    description: { type: String, default: "" }
  },
  { timestamps: true }
);

// Helpful virtual so frontend can use "id" instead of "_id"
itemSchema.virtual("id").get(function () {
  return this._id.toString();
});
itemSchema.set("toJSON", { virtuals: true });

export default mongoose.model("Item", itemSchema);
