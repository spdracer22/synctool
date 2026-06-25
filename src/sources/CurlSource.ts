import { cp, mkdir, rm, stat } from 'node:fs/promises';
import * as path from 'node:path';
import { $, randomUUIDv7 } from 'bun';
import type { SyncSource } from '../schemas/SyncSource';

export const curlSource =
	(url: string, tempDir: string): SyncSource =>
	async (to: string): Promise<void> => {
		const tempSubDirPath = path.join(tempDir, randomUUIDv7());
		await mkdir(tempSubDirPath, { recursive: true });

		const toExists = (await stat(to, { throwIfNoEntry: false })) !== undefined;

		if (toExists) await rm(to, { recursive: true, force: true });

		const downloadPath = path.join(tempSubDirPath, 'download');

		await $`curl --silent --location --output "${downloadPath}" "${url}"`;

		const sourcePath = downloadPath;

		await mkdir(path.dirname(to), { recursive: true });
		await cp(sourcePath, to, { recursive: true });
		await rm(tempSubDirPath, { recursive: true, force: true });
	};
