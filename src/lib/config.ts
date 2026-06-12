import { z } from "zod";
import { file } from "bun";
import { findUp } from "find-up";

const MappingSchema = z.object({
  from: z.string(),
  to: z.string(),
});

const DependencySchema = z.object({
  repo: z.string(),
  mappings: z.array(MappingSchema),
});

const ConfigSchema = z.object({
  "references-dir": z.string(),
  dependencies: z.array(DependencySchema),
});

export type Config = z.infer<typeof ConfigSchema>;

export async function loadConfig(filePath: string): Promise<Config> {
  const jsonData = await file(filePath).json();
  return ConfigSchema.parse(jsonData);
}
