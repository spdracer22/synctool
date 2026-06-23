import { z } from 'zod';

const MappingSchema = z.object({
	from: z.string(),
	to: z.string(),
});

const GitSourceSchema = z.object({
	type: z.literal('git'),
	repo: z.url(),
	mappings: z.array(MappingSchema),
});

const CurlSourceSchema = z.object({
	type: z.literal('curl'),
	url: z.url(),
	mappings: z.array(MappingSchema),
});

const LocalCopySourceSchema = z.object({
	type: z.literal('local-copy'),
	path: z.string(),
	mappings: z.array(MappingSchema),
});

const DependencySchema = z.union([
	GitSourceSchema,
	CurlSourceSchema,
	LocalCopySourceSchema,
]);

export const ConfigSchema = z.object({
	'references-dir': z.string(),
	dependencies: z.array(DependencySchema),
	configPath: z.string().optional(),
});

export type Config = z.infer<typeof ConfigSchema>;
export type Dependency = z.infer<typeof DependencySchema>;
export type Mapping = z.infer<typeof MappingSchema>;
