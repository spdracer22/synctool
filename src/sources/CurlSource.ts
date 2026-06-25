import { mkdir } from 'node:fs/promises';
import * as path from 'node:path';
import { $, randomUUIDv7 } from 'bun';
import type { SourceContext } from '../lib/SourceContext';
import type { CurlInput } from '../schemas/source-curl';

export async function curlSource(
	source: CurlInput,
	context: SourceContext,
): Promise<string> {
	const tempSubDirPath = path.join(context.tempDir, randomUUIDv7());
	await mkdir(tempSubDirPath, { recursive: true });

	const downloadPath = path.join(tempSubDirPath, 'download');

	await $`curl --silent --location --output "${downloadPath}" "${source.url}"`;

	return tempSubDirPath;
}
