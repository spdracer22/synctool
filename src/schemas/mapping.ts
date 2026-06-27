import * as path from 'node:path';
import { z } from 'zod';

const RelativePathSchema = z
	.string()
	.min(1)
	.superRefine((value, ctx) => {
		const isAbsolutePath =
			path.isAbsolute(value) || path.win32.isAbsolute(value);
		const hasDrivePrefix = /^[a-zA-Z]:/.test(value);
		const escapesBaseDir = value.split(/[\\/]+/).includes('..');

		if (isAbsolutePath || hasDrivePrefix || escapesBaseDir) {
			ctx.addIssue({
				code: 'custom',
				message: 'Path must be relative and must not escape its base directory',
			});
		}
	});

export const MappingSchema = z.object({
	from: RelativePathSchema,
	to: RelativePathSchema,
});

export type Mapping = z.infer<typeof MappingSchema>;
