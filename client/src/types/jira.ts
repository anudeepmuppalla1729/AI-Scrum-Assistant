export interface JiraBoard {
  id: number;
  name: string;
  type: string;
  location?: {
    projectId: number;
    displayName: string;
    projectKey: string;
  };
}

export interface JiraSprint {
  id: number;
  self: string;
  state: "active" | "future" | "closed";
  name: string;
  startDate?: string;
  endDate?: string;
  originBoardId?: number;
}

export interface JiraIssue {
  id: string;
  key: string;
  self: string;
  fields: {
    summary: string;
    status: {
      name: string;
      statusCategory?: {
        key: string;
        name: string;
      };
    };
    issuetype: {
      name: string;
      iconUrl?: string;
    };
    priority?: {
      name: string;
      iconUrl?: string;
    };
    created: string;
    updated: string;
    assignee?: {
      displayName: string;
    };
  };
}
