import { cp, mkdir, rm, stat } from "node:fs/promises";
import * as path from "node:path";
import { $ } from "bun";
import { randomUUIDv7 } from "bun";
import type { SyncSource } from "../types/SyncSource.js";

export const curlSource = (url: string, tempDir: string): SyncSource =>
  async (from: string, to: string): Promise<void> => {
    const tempSubDirPath = path.join(tempDir, randomUUIDv7());
    await mkdir(tempSubDirPath, { recursive: true });

    const toDirExists =
      (await stat(to, { throwIfNoEntry: false }))?.isDirectory() ?? false;

    if (toDirExists) await rm(to, { recursive: true, force: true });

    const archivePath = path.join(tempSubDirPath, "archive.tar.gz");

    await $`curl --silent --location --output "${archivePath}" "${url}"`;

    await $`cd "${tempSubDirPath}" && tar -xzf "$(basename "${archivePath}")"`;

    const extractedPath = path.join(tempSubDirPath, from);
    await mkdir(path.dirname(to), { recursive: true });
    await cp(extractedPath, to, { recursive: true });
    await rm(tempSubDirPath, { recursive: true, force: true });
  };
