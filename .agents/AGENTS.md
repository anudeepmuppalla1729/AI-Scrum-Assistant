# AI Scrum Assistant Agent Rules

### Jira Native Priorities
When creating or modifying schemas, AI prompts, or UI components related to issue priorities (Epic, Story, Task, Subtask), ALWAYS use the native Jira priority enums: `["Highest", "High", "Medium", "Low", "Lowest"]`.
Do NOT use internal conventions like `["P0", "P1", "P2", "P3"]` as they will cause Zod validation failures during Jira synchronization.

### Package Manager for Server
When running commands (like installing dependencies) in the `server` directory, ALWAYS use `pnpm` instead of `npm`. For example, use `pnpm install <package>` or `pnpm run <script>`.

### CSS and Styling Guidelines
This project uses a **custom CSS architecture** (`components.css`, `design-tokens.css`). 
**DO NOT use Tailwind CSS utility classes** (e.g., `bg-blue-500`, `p-4`, `flex-col`, `text-sm`). 
ALWAYS use the project's semantic CSS classes (e.g., `.btn`, `.card`, `.badge`, `.input`, `.form-group`) and CSS variables (e.g., `var(--color-accent)`, `var(--space-4)`, `var(--text-sm)`) for styling. If you need a new style, write standard CSS in the appropriate `.css` file or use inline styles with CSS variables if it's a one-off.

