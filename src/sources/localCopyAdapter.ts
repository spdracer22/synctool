import type { MaterializedSource } from '../lib/materializeSource';
import type { LocalSource } from '../schemas/source-local';

export async function localCopyAdapter(
	source: LocalSource,
): Promise<MaterializedSource> {
	return {
		kind: 'folder',
		path: source.path,
		operation: source.operation ?? 'copy',
		mappings: source.mappings,
	};
}
