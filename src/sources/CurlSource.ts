import { mkdir } from 'node:fs/promises';
import * as path from 'node:path';
import { $, randomUUIDv7 } from 'bun';
import type { SourceContext } from '../lib/SourceContext';
import {
	type CurlSource,
	getCurlDownloadFileName,
} from '../schemas/source-curl';

export async function curlSource(
	source: CurlSource,
	context: SourceContext,
): Promise<string> {
	const tempSubDirPath = path.join(context.tempDir, randomUUIDv7());
	await mkdir(tempSubDirPath, { recursive: true });

	const downloadFileNames = new Set(
		source.mappings.map(
			(mapping) => mapping.from ?? getCurlDownloadFileName(source),
		),
	);

	for (const downloadFileName of downloadFileNames) {
		const downloadPath = path.join(tempSubDirPath, downloadFileName);
		await $`curl --silent --location --output "${downloadPath}" "${source.url}"`;
	}

	return tempSubDirPath;
}
