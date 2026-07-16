/**
 * Create a mock JIRA client that mimics the jira.js Version3Client interface.
 * Override specific methods as needed for individual tests.
 */
export const createMockJiraClient = (overrides = {}) => ({
  issueSearch: {
    searchForIssuesUsingJqlPost: async () => ({
      issues: [
        {
          key: "TEST-1",
          fields: {
            summary: "Test Issue",
            issuetype: { name: "Story" },
            status: { name: "To Do" },
            parent: null,
          },
        },
      ],
      total: 1,
    }),
    ...overrides.issueSearch,
  },
  issues: {
    createIssue: async () => ({ id: "10001", key: "TEST-1" }),
    ...overrides.issues,
  },
  issueCreateMetadata: {
    getCreateIssueMeta: async () => ({
      projects: [
        {
          issuetypes: [
            { id: "10001", name: "Epic", subtask: false },
            { id: "10002", name: "Story", subtask: false },
            { id: "10003", name: "Subtask", subtask: true },
          ],
        },
      ],
    }),
    ...overrides.issueCreateMetadata,
  },
  _cloudId: "test-cloud-id",
});

/**
 * Create a mock JIRA client that fails with a specific error.
 */
export const createFailingMockClient = (status = 500, message = "Internal Server Error") => {
  const error = new Error(message);
  error.response = { status, data: { errorMessages: [message] } };
  error.status = status;

  return createMockJiraClient({
    issueSearch: {
      searchForIssuesUsingJqlPost: async () => { throw error; },
    },
    issues: {
      createIssue: async () => { throw error; },
    },
  });
};
