import type { MaterializedSource } from '../lib/materializeSource';
import type { LocalCopySource } from '../schemas/source-local';

export async function localCopyAdapter(
	source: LocalCopySource,
): Promise<MaterializedSource> {
	return {
		kind: 'folder',
		path: source.path,
		mappings: source.mappings,
	};
}
