const buildVelocityRef = (jiraContext) => {
  return {
    "1pt": "half day solo task",
    "2pt": "1 day solo task",
    "3pt": "2 days pair",
    "5pt": "3 days pair",
    "8pt": "full sprint pair (flag needs_splitting)",
    team_velocity: jiraContext.velocity,
    capacity_per_sprint: Math.max(0, jiraContext.velocity * 0.85 - jiraContext.open_bugs * 1.5)
  };
};
export {
  buildVelocityRef
};
