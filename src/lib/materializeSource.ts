import type { Source } from '../schemas/source';
import { curlSource } from '../sources/CurlSource';
import { gitSource } from '../sources/GitSource';
import { localCopySource } from '../sources/LocalCopySource';
import type { SourceContext } from './SourceContext';

export async function materializeSource(
	source: Source,
	context: SourceContext,
): Promise<string> {
	switch (source.type) {
		case 'git':
			return gitSource(source, context);
		case 'curl':
			return curlSource(source, context);
		case 'local-copy':
			return localCopySource(source, context);
		default: {
			const exhaustive: never = source;
			throw new Error(`Unknown sync source type: ${exhaustive}`);
		}
	}
}
