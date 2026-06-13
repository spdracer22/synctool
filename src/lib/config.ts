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

export type Config = z.infer<typeof ConfigSchema> & { configPath: string };

export async function loadConfig(): Promise<Config> {
  const configFile = await findUp("synctool.json");

  if (!configFile) {
    throw new Error("synctool.json not found");
  }

  const jsonData = await file(configFile).json();
  const validated = ConfigSchema.parse(jsonData);

  return { ...validated, configPath: configFile };
}
