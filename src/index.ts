#!/usr/bin/env bun

import { mkdir, rm, stat } from "node:fs/promises";
import * as path from "node:path";
import { $, randomUUIDv7 } from "bun";
import ora from "ora";
import { loadConfig } from "./lib/config";

const __dir = path.dirname(Bun.main);
//console.debug(__dir);

let config;
try {
  config = await loadConfig();
} catch (error) {
  console.error(error instanceof Error ? error.message : "Failed to load config");
  process.exit(1);
}

const __tempDir = path.join(__dir, ".tmp");

const tempDirExists =
  (await stat(__tempDir, { throwIfNoEntry: false }))?.isDirectory() ?? false;

if (!tempDirExists) await mkdir(__tempDir, { recursive: true });

const __refDir = path.join(path.dirname(config.configPath), config["references-dir"]);

const refDirExists =
  (await stat(__refDir, { throwIfNoEntry: false }))?.isDirectory() ?? false;

if (!refDirExists) await mkdir(__refDir, { recursive: true });

for (const dep of config.dependencies) {
  const source = createSource(dep, __tempDir);

  for (const map of dep.mappings) {
    const statusText = `Syncing ${map.from} >> ${path.join(__refDir, map.to)}`;
    const spinner = ora(`${statusText}...`).start();

    try {
      const __toDir = path.join(__refDir, map.to);
      await source(map.from, __toDir);
      spinner.succeed(`${statusText}...Done!`);
    } catch (error) {
      spinner.fail(`${statusText}...Failed!`);
      throw error;
    }
  }
}

const spinner = ora(`Cleaning up..`).start();
await rm(__tempDir, { recursive: true, force: true });
spinner.succeed(`Cleaning up..Done!`);
