import GeneratedBacklog from "../models/GeneratedBacklog.js";
import { pushWorker } from "../services/pushWorker.js";

export const getGeneratedBacklog = async (req, res) => {
  try {
    const { id } = req.params;
    // Check if id is a sessionId or a backlog _id
    // If it's 24 chars it might be an ObjectId, but let's query both
    const backlog = await GeneratedBacklog.findOne({
      $or: [
        { _id: id.length === 24 ? id : null },
        { sessionId: id.length === 24 ? id : null }
      ],
      userId: req.user.userId || req.user._id
    }).sort({ createdAt: -1 });

    if (!backlog) {
      return res.status(404).json({ error: "Generated backlog not found" });
    }

    res.status(200).json(backlog);
  } catch (error) {
    console.error("Error fetching generated backlog:", error);
    res.status(500).json({ error: "Failed to fetch generated backlog" });
  }
};

export const updateGeneratedBacklog = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectedEpicIds } = req.body;

    const backlog = await GeneratedBacklog.findOne({
      $or: [
        { _id: id.length === 24 ? id : null },
        { sessionId: id.length === 24 ? id : null }
      ],
      userId: req.user.userId || req.user._id
    });

    if (!backlog) {
      return res.status(404).json({ error: "Generated backlog not found" });
    }

    if (rejectedEpicIds && Array.isArray(rejectedEpicIds)) {
      let updated = false;
      backlog.epic_statuses.forEach(e => {
        if (rejectedEpicIds.includes(e.epic_id)) {
          e.status = 'rejected';
          updated = true;
        }
      });
      if (updated) {
        backlog.markModified('epic_statuses');
        await backlog.save();
      }
    }

    res.status(200).json({ success: true, message: "Backlog updated" });
  } catch (error) {
    console.error("Error updating generated backlog:", error);
    res.status(500).json({ error: "Failed to update generated backlog" });
  }
};

export const updateStory = async (req, res) => {
  try {
    const { id, storyId } = req.params;
    const updates = req.body;

    const backlog = await GeneratedBacklog.findOneAndUpdate(
      { 
        $or: [
          { _id: id.length === 24 ? id : null },
          { sessionId: id.length === 24 ? id : null }
        ],
        "stories.story_id": storyId, 
        userId: req.user.userId || req.user._id 
      },
      { $set: { "stories.$": updates } },
      { new: true }
    );

    if (!backlog) {
      return res.status(404).json({ error: "Backlog or story not found" });
    }

    res.status(200).json({ success: true, message: "Story updated" });
  } catch (error) {
    console.error("Error updating story:", error);
    res.status(500).json({ error: "Failed to update story" });
  }
};

export const approveAndPush = async (req, res) => {
  try {
    const { id } = req.params;
    const { epicId } = req.body; // If provided, push only this epic. If null, push all pending.

    const backlog = await GeneratedBacklog.findOne({
      $or: [
        { _id: id.length === 24 ? id : null },
        { sessionId: id.length === 24 ? id : null }
      ],
      userId: req.user.userId || req.user._id
    });

    if (!backlog) {
      return res.status(404).json({ error: "Generated backlog not found" });
    }

    // Update epic statuses to 'pushing' synchronously
    let updated = false;
    backlog.epic_statuses.forEach(e => {
      if (epicId) {
        if (e.epic_id === epicId && (e.status === 'pending_review' || e.status === 'failed')) {
          e.status = 'pushing';
          updated = true;
        }
      } else {
        if (e.status === 'pending_review' || e.status === 'failed') {
          e.status = 'pushing';
          updated = true;
        }
      }
    });

    if (updated) {
      backlog.markModified('epic_statuses');
      await backlog.save();
    }

    // Enqueue the push job
    pushWorker.add({
      backlogId: id,
      epicId,
      user: req.user
    });

    res.status(202).json({
      success: true,
      message: epicId ? "Epic queued for Jira push." : "Backlog queued for Jira push.",
    });
  } catch (error) {
    console.error("Error approving and pushing:", error);
    res.status(500).json({ error: "Failed to initiate push" });
  }
};
