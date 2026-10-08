import { constants as fsConstants } from 'node:fs';
import { access, writeFile } from 'node:fs/promises';
import * as path from 'node:path';
import { resolveExplicitConfigPath } from '../lib/config';
import { emptySourcesConfigExample } from './helpExamples';

export type RunInitCliOptions = {
	configPath: string;
};

function formatInitConfigContent(): string {
	return `${emptySourcesConfigExample}\n`;
}

export async function runInitCli(options: RunInitCliOptions): Promise<number> {
	const targetPath = resolveExplicitConfigPath(options.configPath);
	const parentDir = path.dirname(targetPath);

	try {
		await access(parentDir, fsConstants.F_OK);
	} catch {
		console.error(
			`Cannot create configuration: parent directory does not exist: ${parentDir}`,
		);
		return 1;
	}

	const content = formatInitConfigContent();

	try {
		await writeFile(targetPath, content, { encoding: 'utf8', flag: 'wx' });
		console.log(`Created configuration: ${targetPath}`);
		return 0;
	} catch (error) {
		if (error instanceof Error && 'code' in error && error.code === 'EEXIST') {
			console.log(`Configuration already exists: ${targetPath}`);
			return 0;
		}

		const message =
			error instanceof Error ? error.message : 'Failed to create configuration';
		console.error(`Cannot create configuration: ${message}`);
		return 1;
	}
}
