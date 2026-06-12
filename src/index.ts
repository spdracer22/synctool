#!/usr/bin/env bun

import { cp, mkdir, rm, stat } from "node:fs/promises";
import * as path from "node:path";
import { $, randomUUIDv7 } from "bun";
import ora from "ora";
import { loadConfig } from "./lib/config";

const __dir = path.dirname(Bun.main);
//console.debug(__dir);

let config;
let configFile;
try {
  const result = await loadConfig();
  config = result.config;
  configFile = result.configFile;
} catch (error) {
  console.error(error instanceof Error ? error.message : "Failed to load config");
  process.exit(1);
}

const __tempDir = path.join(__dir, ".tmp");

const tempDirExists =
  (await stat(__tempDir, { throwIfNoEntry: false }))?.isDirectory() ?? false;

//console.debug(__tempDir, { exists: tempDirExists });

if (!tempDirExists) await mkdir(__tempDir, { recursive: true });

const __refDir = path.join(path.dirname(configFile), config["references-dir"]);

const refDirExists =
  (await stat(__refDir, { throwIfNoEntry: false }))?.isDirectory() ?? false;

//console.debug(__refDir, { exists: refDirExists });

if (!refDirExists) await mkdir(__refDir, { recursive: true });

for (const dep of config.dependencies) {
  //console.debug(JSON.stringify(dep, null, 2));

  for (const map of dep.mappings) {
    const statusText = `Syncing ${path.join(dep.repo, map.from)} >> ${path.join(__refDir, map.to)}`;

    const spinner = ora(`${statusText}...`).start();

    const tempSubDirPath = path.join(__tempDir, randomUUIDv7());
    await mkdir(tempSubDirPath, { recursive: true });

    const __toDir = path.join(__refDir, map.to);
    const toDirExists =
      (await stat(__toDir, { throwIfNoEntry: false }))?.isDirectory() ?? false;

    if (toDirExists) await rm(__toDir, { recursive: true, force: true });

    //console.debug(__toDir);

    await $`
      git clone --quiet --filter=blob:none --sparse "${dep.repo}" "${tempSubDirPath}"
      cd "${tempSubDirPath}"
      git sparse-checkout set "${map.from}"
      `;

    await cp(path.join(tempSubDirPath, map.from), __toDir, { recursive: true });

    spinner.succeed(`${statusText}...Done!`);
  }
}

const spinner = ora(`Cleaning up..`).start();
await rm(__tempDir, { recursive: true, force: true });
spinner.succeed(`Cleaning up..Done!`);
