import GeneratedBacklog from "../models/GeneratedBacklog.js";
import { pushQueue } from "../integrations/jira/services/pushWorker.js";

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

    // Filter out pushed/rejected epics from the response
    const responseBacklog = backlog.toObject();
    const excludedEpicIds = new Set(
      (responseBacklog.epic_statuses || [])
        .filter(e => e.status === 'pushed' || e.status === 'rejected')
        .map(e => e.epic_id)
    );

    if (excludedEpicIds.size > 0 && responseBacklog.orchestrator_contract?.epics) {
      responseBacklog.orchestrator_contract.epics = responseBacklog.orchestrator_contract.epics
        .filter(epic => !excludedEpicIds.has(epic.id));
      responseBacklog.stories = (responseBacklog.stories || [])
        .filter(story => !excludedEpicIds.has(story.epic_id));
    }

    res.status(200).json(responseBacklog);
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
    }).sort({ createdAt: -1 });

    if (!backlog) {
      return res.status(404).json({ error: "Generated backlog not found" });
    }

    if (rejectedEpicIds && Array.isArray(rejectedEpicIds)) {
      console.log(`[updateGeneratedBacklog] Applying rejected status to epics:`, rejectedEpicIds, `for backlog:`, backlog._id);
      
      // Set to rejected for toggled off epics (only if currently pending_review)
      if (rejectedEpicIds.length > 0) {
        await GeneratedBacklog.updateOne(
          { _id: backlog._id },
          { $set: { "epic_statuses.$[elem].status": "rejected" } },
          { arrayFilters: [{ "elem.epic_id": { $in: rejectedEpicIds }, "elem.status": "pending_review" }] }
        );
      }

      // Set to pending_review for toggled on epics (only if currently rejected)
      await GeneratedBacklog.updateOne(
        { _id: backlog._id },
        { $set: { "epic_statuses.$[elem].status": "pending_review" } },
        { arrayFilters: [{ "elem.epic_id": { $nin: rejectedEpicIds }, "elem.status": "rejected" }] }
      );
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
      { new: true, sort: { createdAt: -1 } }
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
    }).sort({ createdAt: -1 });

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
    await pushQueue.add("push-to-jira", {
      backlogId: backlog._id,
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
