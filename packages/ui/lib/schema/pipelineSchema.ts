import { z } from 'zod';

export const pipelineSchema = z.object({
  nodes: z.array(z.object({
    id: z.string(),
    type: z.string().optional(),
    position: z.object({
      x: z.number(),
      y: z.number(),
    }).optional(),
    data: z.any().optional(),
  }).passthrough()),
  edges: z.array(z.object({
    id: z.string(),
    source: z.string(),
    target: z.string(),
  }).passthrough())
}).passthrough();

export type PipelineSchema = z.infer<typeof pipelineSchema>;
