import { mkdir } from 'node:fs/promises';
import * as path from 'node:path';
import { $, randomUUIDv7 } from 'bun';
import type { SourceContext } from '../lib/SourceContext';
import type { GitInput } from '../schemas/source-git';

export async function gitSource(
	source: GitInput,
	context: SourceContext,
): Promise<string> {
	const tempSubDirPath = path.join(context.tempDir, randomUUIDv7());
	await mkdir(tempSubDirPath, { recursive: true });

	await $`git clone --quiet --filter=blob:none "${source.repo}" "${tempSubDirPath}"`;

	return tempSubDirPath;
}
