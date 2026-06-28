#!/usr/bin/env bun

import { cp, mkdir, mkdtemp, rm, stat } from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import ora from 'ora';
import { loadConfig } from './lib/config';
import { materializeSource } from './lib/materializeSource';
import type { Config } from './schemas/config';

function createSpinner(text: string) {
	return ora({ text, discardStdin: false }).start();
}

let config: Config;
try {
	config = await loadConfig();
} catch (error) {
	console.error(
		error instanceof Error ? error.message : 'Failed to load config',
	);
	process.exit(1);
}

const __tempDir = await mkdtemp(path.join(os.tmpdir(), 'synctool-'));

if (!config.configPath) {
	console.error('Config error: configPath not specified.');
	process.exit(1);
}

const configDir = path.dirname(config.configPath);

for (const dep of config.sources) {
	const sourceSpinner = createSpinner(`Loading ${dep.type} source...`);
	let sourcePath: string;

	try {
		sourcePath = await materializeSource(dep, { tempDir: __tempDir });
		sourceSpinner.succeed(`Loading ${dep.type} source...Done!`);
	} catch (error) {
		sourceSpinner.fail(`Loading ${dep.type} source...Failed!`);
		throw error;
	}

	for (const map of dep.mappings) {
		const fromPath = path.join(sourcePath, map.from);
		const toPath = path.join(configDir, map.to);
		const statusText = `Syncing ${fromPath} >> ${toPath}`;
		const spinner = createSpinner(`${statusText}...`);

		try {
			const toExists =
				(await stat(toPath, { throwIfNoEntry: false })) !== undefined;

			if (toExists) await rm(toPath, { recursive: true, force: true });

			await mkdir(path.dirname(toPath), { recursive: true });
			await cp(fromPath, toPath, { recursive: true });
			spinner.succeed(`${statusText}...Done!`);
		} catch (error) {
			spinner.fail(`${statusText}...Failed!`);
			throw error;
		}
	}
}

const spinner = createSpinner(`Cleaning up..`);
await rm(__tempDir, { recursive: true, force: true });
spinner.succeed(`Cleaning up..Done!`);
