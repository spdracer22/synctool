import { z } from 'zod';
import { CurlSourceSchema } from './source-curl';
import { GitSourceSchema } from './source-git';
import { LocalCopySourceSchema } from './source-local';

export const SourceSchema = z.union([
	GitSourceSchema,
	CurlSourceSchema,
	LocalCopySourceSchema,
]);

export type Source = z.infer<typeof SourceSchema>;
