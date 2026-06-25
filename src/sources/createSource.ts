import type { SyncSource } from '../schemas/SyncSource';
import type { Source } from '../schemas/source';
import { curlSource } from './CurlSource';
import { gitSource } from './GitSource';
import { localCopySource } from './LocalCopySource';

export function createSource(source: Source, tempDir: string): SyncSource {
	switch (source.type) {
		case 'git':
			return gitSource(source.repo, tempDir);
		case 'curl':
			return curlSource(source.url, tempDir);
		case 'local-copy':
			return localCopySource(source.path);
		default: {
			const exhaustive: never = source;
			throw new Error(`Unknown sync source type: ${exhaustive}`);
		}
	}
}
