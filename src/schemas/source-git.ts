import { z } from 'zod';
import { FromToMappingSchema } from './mapping';
import { SourceEnvelopeSchema } from './source-envelope';

export const GitInputSchema = z.object({
	repo: z.url(),
});

export const GitSourceSchema = SourceEnvelopeSchema(
	'git',
	GitInputSchema,
	FromToMappingSchema,
);

export type GitInput = z.infer<typeof GitInputSchema>;
export type GitSource = z.infer<typeof GitSourceSchema>;
