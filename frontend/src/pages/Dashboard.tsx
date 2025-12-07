import { useEffect, useState } from "react";
import { getBoards, getSprints, getSprintIssues, createIssue } from "../api/jiraApi";

const Dashboard = () => {
  const cloudId = localStorage.getItem("cloudId");
  const [activeSprintIssues, setActiveSprintIssues] = useState<any[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const run = async () => {
      try {
        const boards = await getBoards(token);
        if (!boards || boards.length === 0) return;

        // Using the FIRST board for now
        const board = boards[0];
        console.log("Boards:", boards);

        const sprints = await getSprints(board.id, token);
        if (!sprints || sprints.length === 0) return;
        console.log(`Sprints for board ${board.id}:`, sprints);

        const activeSprint = sprints.find((s: any) => s.state === "active");

        if (activeSprint) {
          const issues = await getSprintIssues(activeSprint.id, token);
          console.log(`Issues for sprint ${activeSprint.id}:`, issues);
          setActiveSprintIssues(issues);
        } else {
          console.log("No active sprint found.");
        }
      } catch (error) {
        console.error("Error fetching Jira data:", error);
      }
    };

    run();
  }, []);

  const handleCreateTestIssue = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("No token found");
      return;
    }

    try {
      const newIssue = await createIssue({
        fields: {
          summary: "AI Test Story from Dashboard Button",
          issuetype: { name: "Story" },
          project: { key: "SCRUM" }
        }
      }, token);

      console.log("Issue created:", newIssue);
      alert(`Issue created: ${newIssue.key}`);
    } catch (error) {
      console.error("Failed to create issue:", error);
      alert("Failed to create issue");
    }
  };

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Cloud ID: {cloudId}</p>
      <p>Jira integration is live.</p>
      <button onClick={handleCreateTestIssue} style={{ marginTop: "20px", padding: "10px" }}>
        Create Test Issue
      </button>

      <button
        onClick={() => window.location.href = "/chat"}
        style={{ marginTop: "20px", padding: "10px", marginLeft: "10px" }}>
        Go to AI Chat
      </button>

      {activeSprintIssues.length > 0 && (
        <div style={{ marginTop: "20px" }}>
          <h2>Active Sprint Issues</h2>
          <ul>
            {activeSprintIssues.map((issue: any) => (
              <li key={issue.id}>
                {issue.key}: {issue.fields.summary}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
