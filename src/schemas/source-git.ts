import { z } from 'zod';
import { MappingSchema } from './mapping';

export const GitSourceSchema = z.object({
	type: z.literal('git'),
	repo: z.url(),
	mappings: z.array(MappingSchema),
});
