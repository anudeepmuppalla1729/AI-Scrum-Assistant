import mongoose from "mongoose";

const businessDocumentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    filename: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    boardId: {
      type: String,
    },
    syncStatus: {
      type: String,
      enum: ["PENDING", "SYNCED", "FAILED"],
      default: "PENDING",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("BusinessDocument", businessDocumentSchema);
