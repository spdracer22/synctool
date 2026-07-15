import { mkdir } from 'node:fs/promises';
import * as path from 'node:path';
import { $, randomUUIDv7 } from 'bun';
import type { SourceContext } from '../lib/SourceContext';
import type { CurlInput } from '../schemas/source-curl';

function getDownloadFileName(source: CurlInput): string {
	const urlPath = new URL(source.url).pathname;
	const urlFileName = path.basename(urlPath);

	if (urlFileName && path.extname(urlFileName)) {
		return urlFileName;
	}

	if (source.extension) {
		return `data${source.extension.startsWith('.') ? source.extension : `.${source.extension}`}`;
	}

	return 'data';
}

export async function curlSource(
	source: CurlInput,
	context: SourceContext,
): Promise<string> {
	const tempSubDirPath = path.join(context.tempDir, randomUUIDv7());
	await mkdir(tempSubDirPath, { recursive: true });

	const downloadPath = path.join(tempSubDirPath, getDownloadFileName(source));

	await $`curl --silent --location --output "${downloadPath}" "${source.url}"`;

	return tempSubDirPath;
}
