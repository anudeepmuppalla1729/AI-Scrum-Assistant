/**
 * Executes a JQL query to retrieve a list of issues (used for Indexing, Spillover, etc.).
 * @param {object} client - The dynamic Jira Version3Client.
 * @param {string} jqlString - The Jira Query Language string.
 * @returns {Promise<object[]>} An array of issue objects.
 */
export const search = async (client, jqlString) => {
  try {
    // client.issueSearch.searchForIssuesUsingJqlPost maps to the POST /rest/api/3/search endpoint.
    // The GET endpoint (searchForIssuesUsingJql) is deprecated/removed for some instances.
    const response =
      await client.issueSearch.searchForIssuesUsingJqlEnhancedSearchPost({
        jql: jqlString,
        // Common fields + Story Points (often customfield_10002)
        fields: [
          "summary",
          "description",
          "status",
          "project",
          "issuetype",
          "customfield_10002",
        ],
      });
    return response.issues;
  } catch (error) {
    console.error(
      "Error searching Jira issues with JQL:",
      error.response?.data || error.message
    );
    throw new Error("Failed to search issues in Jira.");
  }
};
