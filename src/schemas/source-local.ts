import { z } from 'zod';
import { FromToMappingSchema } from './mapping';
import { SourceEnvelopeSchema } from './source-envelope';

export const LocalOperationSchema = z.enum(['copy', 'symlink']);

export const LocalInputSchema = z.object({
	path: z.string(),
	operation: LocalOperationSchema.default('copy'),
});

export const LocalCopySourceSchema = SourceEnvelopeSchema(
	'local-copy',
	LocalInputSchema,
	FromToMappingSchema,
);

export const LocalSourceSchema = SourceEnvelopeSchema(
	'local',
	LocalInputSchema,
	FromToMappingSchema,
);

export type LocalOperation = z.infer<typeof LocalOperationSchema>;
export type LocalInput = z.input<typeof LocalInputSchema>;
export type LocalSource =
	| z.input<typeof LocalCopySourceSchema>
	| z.input<typeof LocalSourceSchema>;
