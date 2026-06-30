import mongoose from "mongoose";

const subtaskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: "" },
  acceptance_criteria: { type: [String], default: [] },
  priority: { type: String, enum: ["Highest", "High", "Medium", "Low", "Lowest"], default: "Medium" },
  story_points: { type: Number, default: 1 },
}, { _id: false });

const storySchema = new mongoose.Schema({
  story_id: { type: String, required: true },
  epic_id: { type: String, required: true },
  user_story: { type: String, required: true },
  description: { type: String, default: "" },
  acceptance_criteria: { type: [String], default: [] },
  priority: { type: String, enum: ["Highest", "High", "Medium", "Low", "Lowest"], default: "Medium" },
  story_points: { type: mongoose.Schema.Types.Mixed, default: 3 }, // number or "needs_splitting"
  sprint: { type: Number, default: 1 },
  subtasks: { type: [subtaskSchema], default: [] },
  validation_status: { type: String, enum: ["passed", "failed"], default: "passed" },
  failure_reasons: { type: [String], default: [] },
  retry_count: { type: Number, default: 0 },
}, { _id: false });

const epicStatusSchema = new mongoose.Schema({
  epic_id: { type: String, required: true },
  status: { 
    type: String, 
    enum: ["pending_review", "approved", "pushing", "pushed", "failed"], 
    default: "pending_review" 
  },
  jira_push_result: { type: mongoose.Schema.Types.Mixed, default: null },
  pushed_at: { type: Date, default: null },
}, { _id: false });

const generatedBacklogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PRDSession",
      required: true,
      index: true,
    },
    projectKey: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending_review", "partially_pushed", "fully_pushed", "rejected"],
      default: "pending_review",
    },
    orchestrator_contract: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    stories: {
      type: [storySchema],
      default: [],
    },
    epic_statuses: {
      type: [epicStatusSchema],
      default: [],
    },
    validation_report: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const GeneratedBacklog = mongoose.model("GeneratedBacklog", generatedBacklogSchema);

export default GeneratedBacklog;
