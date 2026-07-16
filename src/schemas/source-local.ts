import { z } from 'zod';
import { FromToMappingSchema } from './mapping';
import { SourceEnvelopeSchema } from './source-envelope';

export const LocalCopyInputSchema = z.object({
	path: z.string(),
});

export const LocalCopySourceSchema = SourceEnvelopeSchema(
	'local-copy',
	LocalCopyInputSchema,
	FromToMappingSchema,
);

export type LocalCopyInput = z.infer<typeof LocalCopyInputSchema>;
export type LocalCopySource = z.infer<typeof LocalCopySourceSchema>;
