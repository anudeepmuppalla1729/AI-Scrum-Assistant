# AI Scrum Assistant Agent Rules

### Jira Native Priorities
When creating or modifying schemas, AI prompts, or UI components related to issue priorities (Epic, Story, Task, Subtask), ALWAYS use the native Jira priority enums: `["Highest", "High", "Medium", "Low", "Lowest"]`.
Do NOT use internal conventions like `["P0", "P1", "P2", "P3"]` as they will cause Zod validation failures during Jira synchronization.

### Package Manager for Server
When running commands (like installing dependencies) in the `server` directory, ALWAYS use `pnpm` instead of `npm`. For example, use `pnpm install <package>` or `pnpm run <script>`.
