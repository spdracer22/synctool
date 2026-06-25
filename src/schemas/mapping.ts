import { z } from 'zod';

export const MappingSchema = z.object({
	from: z.string(),
	to: z.string(),
});

export type Mapping = z.infer<typeof MappingSchema>;
