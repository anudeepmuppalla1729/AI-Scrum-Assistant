import mongoose from "mongoose";

const pushedBacklogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChatSession",
      required: true,
      index: true,
    },
    projectKey: {
      type: String,
      required: true,
    },
    jiraKey: {
      type: String,
      required: true,
    },
    jiraId: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["Epic", "Story", "Task", "Subtask", "Bug"],
      required: true,
    },
    summary: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    storyPoints: {
      type: Number,
    },
    priority: {
      type: String,
    },
    parentKey: {
      type: String,
      default: null,
    },
    parentSummary: {
      type: String,
      default: null,
    },
    jiraUrl: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const PushedBacklog = mongoose.model("PushedBacklog", pushedBacklogSchema);

export default PushedBacklog;
