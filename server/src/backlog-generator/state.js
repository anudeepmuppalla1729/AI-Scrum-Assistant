import { Annotation } from "@langchain/langgraph";
const StateAnnotation = Annotation.Root({
  raw_prd: Annotation,
  business_docs: Annotation,
  business_docs_count: Annotation,
  boardId: Annotation,
  projectKey: Annotation,
  userId: Annotation,
  sessionId: Annotation,
  jira_context: Annotation,
  prd_token_count: Annotation,
  complexity_tier: Annotation,
  orchestrator_contract: Annotation,
  send_list: Annotation,
  current_batch: Annotation({
    reducer: (left, right) => {
      if (right && right._replace) return right.items;
      if (Array.isArray(right) && right.length === 0) return [];
      if (Array.isArray(right)) return left.concat(right);
      return left;
    },
    default: () => []
  }),
  written_stories: Annotation({
    reducer: (left, right) => left.concat(right),
    default: () => []
  }),
  validation_report: Annotation,
  revision_count: Annotation({
    reducer: (left, right) => right,
    default: () => 0
  })
});
export {
  StateAnnotation
};
