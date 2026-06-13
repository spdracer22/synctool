import type { Dependency } from "../types/config.js";
import type { SyncSource } from "../types/SyncSource.js";
import { CurlSource } from "./CurlSource.js";
import { GitSource } from "./GitSource.js";
import { LocalCopySource } from "./LocalCopySource.js";

export function createSource(dep: Dependency, tempDir: string): SyncSource {
  switch (dep.type) {
    case "git":
      return new GitSource(dep.repo, tempDir);
    case "curl":
      return new CurlSource(dep.url, tempDir);
    case "local-copy":
      return new LocalCopySource(dep.path);
    default:
      const exhaustive: never = dep;
      throw new Error(`Unknown sync source type: ${exhaustive}`);
  }
}
