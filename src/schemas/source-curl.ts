import { z } from 'zod';
import { SourceEnvelopeSchema } from './source-envelope';

export const CurlInputSchema = z.object({
	url: z.url(),
	extension: z.string().optional(),
});

export const CurlSourceSchema = SourceEnvelopeSchema('curl', CurlInputSchema);

export type CurlInput = z.infer<typeof CurlInputSchema>;
export type CurlSource = z.infer<typeof CurlSourceSchema>;
