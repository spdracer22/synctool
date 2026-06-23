import { cp, mkdir, rm, stat } from 'node:fs/promises';
import * as path from 'node:path';
import type { SyncSource } from '../types/SyncSource.js';

export const localCopySource =
	(basePath: string): SyncSource =>
	async (from: string, to: string): Promise<void> => {
		const fromPath = path.join(basePath, from);
		const toDirExists =
			(await stat(to, { throwIfNoEntry: false }))?.isDirectory() ?? false;

		if (toDirExists) await rm(to, { recursive: true, force: true });

		await mkdir(path.dirname(to), { recursive: true });
		await cp(fromPath, to, { recursive: true });
	};
