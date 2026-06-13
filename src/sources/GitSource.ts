import { cp, mkdir, rm, stat } from "node:fs/promises";
import * as path from "node:path";
import { $ } from "bun";
import { randomUUIDv7 } from "bun";
import type { SyncSource } from "../types/SyncSource.js";

export class GitSource implements SyncSource {
  constructor(
    private repo: string,
    private tempDir: string,
  ) {}

  async sync(from: string, to: string): Promise<void> {
    const tempSubDirPath = path.join(this.tempDir, randomUUIDv7());
    await mkdir(tempSubDirPath, { recursive: true });

    const toDirExists =
      (await stat(to, { throwIfNoEntry: false }))?.isDirectory() ?? false;

    if (toDirExists) await rm(to, { recursive: true, force: true });

    await $`
      git clone --quiet --filter=blob:none --sparse "${this.repo}" "${tempSubDirPath}"
      cd "${tempSubDirPath}"
      git sparse-checkout set "${from}"
    `;

    await mkdir(path.dirname(to), { recursive: true });
    await cp(path.join(tempSubDirPath, from), to, { recursive: true });
    await rm(tempSubDirPath, { recursive: true, force: true });
  }
}
