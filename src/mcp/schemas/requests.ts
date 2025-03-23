import { z } from 'zod';

/**
 * Request schema for LND API operations
 * Defines the structure of requests to the Lightning Network node
 */
export const RequestSchema = z.object({
  // HTTP method for the request
  method: z.enum(['GET', 'POST']),

  // Query parameters
  params: z.object({
    // Optional channel ID to target a specific channel
    channelId: z.string().optional(),

    // Optional limit for paginated results
    limit: z.number().int().nonnegative().optional(),
  }),
});

/**
 * Type inference for LND requests
 */
export type Request = z.infer<typeof RequestSchema>;
