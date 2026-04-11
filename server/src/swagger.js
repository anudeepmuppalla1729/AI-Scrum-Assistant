import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

// Centralized Swagger setup. Import setupSwagger(app) in server.js and call it.
export function setupSwagger(app) {
  const options = {
    definition: {
      openapi: "3.0.3",
      info: {
        title: "AI Scrum Assistant API",
        version: "1.0.0",
        description:
          "API for generating AI suggestions from PRDs and pushing them to Jira (Team-managed).",
      },
      servers: [
        {
          url: "http://localhost:2000",
          description: "Local server",
        },
      ],
      components: {
        schemas: {
          PushAISuggestionsRequest: {
            type: "object",
            properties: {
              projectKey: { type: "string", example: "SCRUM" },
              suggestions: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  message: {
                    type: "string",
                    example: "AI-generated suggestions retrieved successfully.",
                  },
                  data: {
                    type: "object",
                    properties: {
                      epics: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            title: { type: "string" },
                            description: { type: "string" },
                            issues: {
                              type: "array",
                              items: {
                                type: "object",
                                properties: {
                                  type: { type: "string", example: "Story" },
                                  summary: { type: "string" },
                                  description: { type: "string" },
                                  priority: {
                                    type: "string",
                                    enum: [
                                      "Highest",
                                      "High",
                                      "Medium",
                                      "Low",
                                      "Lowest",
                                    ],
                                  },
                                  story_points: { type: "number" },
                                  sub_issues: {
                                    type: "array",
                                    items: {
                                      type: "object",
                                      properties: {
                                        type: {
                                          type: "string",
                                          example: "Task",
                                        },
                                        summary: { type: "string" },
                                        description: { type: "string" },
                                        priority: {
                                          type: "string",
                                          enum: [
                                            "Highest",
                                            "High",
                                            "Medium",
                                            "Low",
                                            "Lowest",
                                          ],
                                        },
                                      },
                                      required: ["summary"],
                                    },
                                  },
                                },
                                required: ["type", "summary"],
                              },
                            },
                          },
                          required: ["title"],
                        },
                      },
                      jira_issues: {
                        type: "array",
                        items: { type: "object" },
                      },
                    },
                    required: ["epics"],
                  },
                },
                required: ["data"],
              },
            },
            required: ["projectKey", "suggestions"],
          },
          PushAISuggestionsResponse: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              created: {
                type: "object",
                properties: {
                  epics: { type: "array", items: { type: "object" } },
                  stories: { type: "array", items: { type: "object" } },
                  subtasks: { type: "array", items: { type: "object" } },
                },
              },
              errors: {
                type: "array",
                items: { type: "object" },
              },
            },
          },
        },
      },
    },
    // Globs relative to the backend project root
    apis: ["./src/routes/*.js", "./src/controllers/*.js"],
  };

  const swaggerSpec = swaggerJsdoc(options);
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}
