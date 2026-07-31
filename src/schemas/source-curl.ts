import { z } from 'zod';
import { ToMappingSchema } from './mapping';

export const CurlInputSchema = z.object({
	url: z.url(),
	extension: z.string().optional(),
});

export const CurlSourceSchema = CurlInputSchema.extend({
	type: z.literal('curl'),
	mappings: z.array(ToMappingSchema),
});

export type CurlInput = z.infer<typeof CurlInputSchema>;
export type CurlSource = z.infer<typeof CurlSourceSchema>;
