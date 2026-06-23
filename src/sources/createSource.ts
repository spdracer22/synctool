import type { Dependency } from '../types/config.js';
import type { SyncSource } from '../types/SyncSource.js';
import { curlSource } from './CurlSource.js';
import { gitSource } from './GitSource.js';
import { localCopySource } from './LocalCopySource.js';

export function createSource(dep: Dependency, tempDir: string): SyncSource {
	switch (dep.type) {
		case 'git':
			return gitSource(dep.repo, tempDir);
		case 'curl':
			return curlSource(dep.url, tempDir);
		case 'local-copy':
			return localCopySource(dep.path);
		default: {
			const exhaustive: never = dep;
			throw new Error(`Unknown sync source type: ${exhaustive}`);
		}
	}
}
