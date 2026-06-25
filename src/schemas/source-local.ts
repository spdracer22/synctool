import { z } from 'zod';
import { SourceEnvelopeSchema } from './source-envelope';

export const LocalCopyInputSchema = z.object({
	path: z.string(),
});

export const LocalCopySourceSchema = SourceEnvelopeSchema(
	'local-copy',
	LocalCopyInputSchema,
);

export type LocalCopyInput = z.infer<typeof LocalCopyInputSchema>;
export type LocalCopySource = z.infer<typeof LocalCopySourceSchema>;
