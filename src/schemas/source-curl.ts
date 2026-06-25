import { z } from 'zod';

import { MappingSchema } from './mapping';

export const CurlSourceSchema = z.object({
	type: z.literal('curl'),
	url: z.url(),
	mappings: z.array(MappingSchema),
});
