#!/usr/bin/env bun

import * as path from 'node:path';
import ora from 'ora';
import { loadConfig } from './lib/config';
import {
	type ReferenceSyncProgressEvent,
	runReferenceSync,
} from './lib/runReferenceSync';
import type { Config } from './schemas/config';

function createSpinner(text: string) {
	return ora({ text, discardStdin: false }).start();
}

const spinners = new Map<string, ReturnType<typeof createSpinner>>();

function spinnerKey(event: ReferenceSyncProgressEvent): string {
	switch (event.type) {
		case 'source:start':
		case 'source:success':
		case 'source:failure':
			return `source:${event.sourceIndex}`;
		case 'mapping:start':
		case 'mapping:success':
		case 'mapping:failure':
			return `mapping:${event.sourceIndex}:${event.mappingIndex}`;
		case 'cleanup:start':
		case 'cleanup:success':
		case 'cleanup:failure':
			return 'cleanup';
	}
}

function handleProgress(event: ReferenceSyncProgressEvent) {
	const key = spinnerKey(event);

	switch (event.type) {
		case 'source:start':
			spinners.set(key, createSpinner(`Loading ${event.sourceType} source...`));
			break;
		case 'source:success':
			spinners.get(key)?.succeed(`Loading ${event.sourceType} source...Done!`);
			spinners.delete(key);
			break;
		case 'source:failure':
			spinners.get(key)?.fail(`Loading ${event.sourceType} source...Failed!`);
			spinners.delete(key);
			break;
		case 'mapping:start': {
			const statusText = `Syncing ${event.fromPath} >> ${event.toPath}`;
			spinners.set(key, createSpinner(`${statusText}...`));
			break;
		}
		case 'mapping:success': {
			const statusText = `Syncing ${event.fromPath} >> ${event.toPath}`;
			spinners.get(key)?.succeed(`${statusText}...Done!`);
			spinners.delete(key);
			break;
		}
		case 'mapping:failure': {
			const statusText = `Syncing ${event.fromPath} >> ${event.toPath}`;
			spinners.get(key)?.fail(`${statusText}...Failed!`);
			spinners.delete(key);
			break;
		}
		case 'cleanup:start':
			spinners.set(key, createSpinner(`Cleaning up..`));
			break;
		case 'cleanup:success':
			spinners.get(key)?.succeed(`Cleaning up..Done!`);
			spinners.delete(key);
			break;
		case 'cleanup:failure':
			spinners.get(key)?.fail(`Cleaning up..Failed!`);
			spinners.delete(key);
			break;
	}
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

if (!config.configPath) {
	console.error('Config error: configPath not specified.');
	process.exit(1);
}

const configDir = path.dirname(config.configPath);
const result = await runReferenceSync({
	config,
	configDir,
	onProgress: handleProgress,
});

if (result.sources.some((source) => source.status === 'failed')) {
	process.exitCode = 1;
}
