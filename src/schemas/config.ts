import { z } from 'zod';

import { SourceSchema } from './source';

export const ConfigSchema = z.object({
	sources: z.array(SourceSchema),
	configPath: z.string().optional(),
});

export type Config = z.input<typeof ConfigSchema>;
