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

export interface ConfigResult {
  config: Config;
  configFile: string;
}

export async function loadConfig(): Promise<ConfigResult> {
  const configFile = await findUp("synctool.json");

  if (!configFile) {
    throw new Error("synctool.json not found");
  }

  const jsonData = await file(configFile).json();
  const config = ConfigSchema.parse(jsonData);

  return { config, configFile };
}
