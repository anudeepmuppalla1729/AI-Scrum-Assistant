import mongoose from "mongoose";

const prdSessionSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        title: {
            type: String,
            default: "Untitled PRD",
        },
        prompt: {
            type: String,
            default: "",
        },
        epics: {
            type: Array, // Storing the full JSON structure of epics/stories/tasks
            default: [],
        },
        options: {
            includeAcceptanceCriteria: { type: Boolean, default: true },
            estimateStoryPoints: { type: Boolean, default: true },
            includeSubTasks: { type: Boolean, default: true },
        },
    },
    {
        timestamps: true,
    }
);

const PRDSession = mongoose.model("PRDSession", prdSessionSchema);

export default PRDSession;
