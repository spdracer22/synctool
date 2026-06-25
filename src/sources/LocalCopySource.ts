import type { SourceContext } from '../lib/SourceContext';
import type { LocalCopyInput } from '../schemas/source-local';

export async function localCopySource(
	source: LocalCopyInput,
	_context: SourceContext,
): Promise<string> {
	return source.path;
}
