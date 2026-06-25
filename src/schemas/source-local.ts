import { z } from 'zod';

import { MappingSchema } from './mapping';

export const LocalCopySourceSchema = z.object({
	type: z.literal('local-copy'),
	path: z.string(),
	mappings: z.array(MappingSchema),
});
