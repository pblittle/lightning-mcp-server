import { z } from 'zod';

/**
 * Schema defining MCP tool responses according to protocol specifications.
 *
 * The MCP protocol requires consistent response structures to maintain
 * interoperability between clients and servers. This schema enforces
 * those constraints while allowing for varied response data.
 */
export const McpToolResponseSchema = z.object({
  tools: z
    .array(
      z.object({
        name: z.string().min(1),
        inputSchema: z.object({
          type: z.literal('object'),
          properties: z.record(z.unknown()).optional(),
        }),
        description: z.string().optional(),
      })
    )
    .optional()
    .default([]),

  response: z.string(),
  data: z.record(z.unknown()),
  _meta: z.record(z.unknown()).optional(),
});

/**
 * TypeScript interface derived from MCP schema.
 *
 * Using z.infer ensures the TypeScript type stays in sync with the schema
 * validation, preventing runtime/compile time type mismatches.
 */
export type McpToolResponse = z.infer<typeof McpToolResponseSchema>;
