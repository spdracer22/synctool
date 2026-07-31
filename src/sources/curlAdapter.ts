import * as path from 'node:path';
import { $ } from 'bun';
import type {
	MaterializedSource,
	SourceMaterializationProcesses,
} from '../lib/materializeSource';
import type { CurlSource } from '../schemas/source-curl';

async function defaultCurlDownload(url: string, destinationPath: string) {
	await $`curl --silent --location --output "${destinationPath}" "${url}"`;
}

export function getCurlDownloadFileName(source: CurlSource): string {
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

export async function curlAdapter(
	source: CurlSource,
	materializationFilePath: string,
	processes: Partial<Pick<SourceMaterializationProcesses, 'curlDownload'>> = {},
): Promise<MaterializedSource> {
	await (processes.curlDownload ?? defaultCurlDownload)(
		source.url,
		materializationFilePath,
	);

	return {
		kind: 'single-file',
		path: materializationFilePath,
		mappings: source.mappings,
	};
}
