import { z } from 'zod';
import { CurlSourceSchema } from './source-curl';
import { GitSourceSchema } from './source-git';
import { LocalCopySourceSchema, LocalSourceSchema } from './source-local';

export const SourceSchema = z.discriminatedUnion('type', [
	GitSourceSchema,
	CurlSourceSchema,
	LocalCopySourceSchema,
	LocalSourceSchema,
]);

export type Source = z.input<typeof SourceSchema>;
