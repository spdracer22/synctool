import { z } from 'zod';

import { SourceSchema } from './source';

export const ConfigSchema = z.object({
	'references-dir': z.string(),
	sources: z.array(SourceSchema),
	configPath: z.string().optional(),
});

export type Config = z.infer<typeof ConfigSchema>;
