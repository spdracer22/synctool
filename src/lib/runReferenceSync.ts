import { cp, mkdir, mkdtemp, rm, stat } from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import type { Config } from '../schemas/config';
import type { Source } from '../schemas/source';
import {
	applyMapping,
	type MappingProcesses,
	planMapping,
} from './applyMapping';
import { materializeSource as defaultMaterializeSource } from './materializeSource';

export type ReferenceSyncProgressEvent =
	| { type: 'source:start'; sourceIndex: number; sourceType: Source['type'] }
	| { type: 'source:success'; sourceIndex: number; sourceType: Source['type'] }
	| {
			type: 'source:failure';
			sourceIndex: number;
			sourceType: Source['type'];
			error: unknown;
	  }
	| {
			type: 'mapping:start';
			sourceIndex: number;
			mappingIndex: number;
			fromPath: string;
			toPath: string;
	  }
	| {
			type: 'mapping:success';
			sourceIndex: number;
			mappingIndex: number;
			fromPath: string;
			toPath: string;
	  }
	| {
			type: 'mapping:failure';
			sourceIndex: number;
			mappingIndex: number;
			fromPath: string;
			toPath: string;
			error: unknown;
	  }
	| { type: 'cleanup:start'; tempDir: string }
	| { type: 'cleanup:success'; tempDir: string }
	| { type: 'cleanup:failure'; tempDir: string; error: unknown };

export type ReferenceSyncSourceResult =
	| { sourceIndex: number; sourceType: Source['type']; status: 'synced' }
	| {
			sourceIndex: number;
			sourceType: Source['type'];
			status: 'failed';
			error: unknown;
	  };

export type ReferenceSyncResult = {
	sources: ReferenceSyncSourceResult[];
};

type FileSystem = {
	stat: typeof stat;
	rm: typeof rm;
	mkdir: typeof mkdir;
	cp: typeof cp;
};

type TempDirs = {
	create: () => Promise<string>;
	remove: (tempDir: string) => Promise<void>;
};

export type RunReferenceSyncDependencies = {
	materializeSource?: typeof defaultMaterializeSource;
	fileSystem?: FileSystem;
	tempDirs?: TempDirs;
	processes?: Partial<MappingProcesses>;
};

export type RunReferenceSyncOptions = {
	config: Config;
	configDir: string;
	onProgress?: (event: ReferenceSyncProgressEvent) => void;
	dependencies?: RunReferenceSyncDependencies;
};

const defaultFileSystem: FileSystem = { stat, rm, mkdir, cp };

const defaultTempDirs: TempDirs = {
	create: () => mkdtemp(path.join(os.tmpdir(), 'synctool-')),
	remove: (tempDir) => rm(tempDir, { recursive: true, force: true }),
};

export async function runReferenceSync({
	config,
	configDir,
	onProgress,
	dependencies = {},
}: RunReferenceSyncOptions): Promise<ReferenceSyncResult> {
	if (config.sources.length === 0) {
		return { sources: [] };
	}

	const materializeSource =
		dependencies.materializeSource ?? defaultMaterializeSource;
	const fileSystem = dependencies.fileSystem ?? defaultFileSystem;
	const tempDirs = dependencies.tempDirs ?? defaultTempDirs;
	const processes = dependencies.processes;
	const tempDir = await tempDirs.create();
	const results: ReferenceSyncSourceResult[] = [];

	let runError: unknown;
	try {
		for (const [sourceIndex, source] of config.sources.entries()) {
			onProgress?.({
				type: 'source:start',
				sourceIndex,
				sourceType: source.type,
			});

			let materializedSource: Awaited<
				ReturnType<typeof defaultMaterializeSource>
			>;
			try {
				materializedSource = await materializeSource(source, { tempDir });
				onProgress?.({
					type: 'source:success',
					sourceIndex,
					sourceType: source.type,
				});
			} catch (error) {
				onProgress?.({
					type: 'source:failure',
					sourceIndex,
					sourceType: source.type,
					error,
				});
				results.push({
					sourceIndex,
					sourceType: source.type,
					status: 'failed',
					error,
				});
				continue;
			}

			let sourceFailed = false;
			for (const [mappingIndex, map] of materializedSource.mappings.entries()) {
				const plan = planMapping({
					mapping: map,
					materializedSource,
					configDir,
				});

				onProgress?.({
					type: 'mapping:start',
					sourceIndex,
					mappingIndex,
					fromPath: plan.fromPath,
					toPath: plan.toPath,
				});

				try {
					await applyMapping({ plan, fileSystem, processes });

					onProgress?.({
						type: 'mapping:success',
						sourceIndex,
						mappingIndex,
						fromPath: plan.fromPath,
						toPath: plan.toPath,
					});
				} catch (error) {
					onProgress?.({
						type: 'mapping:failure',
						sourceIndex,
						mappingIndex,
						fromPath: plan.fromPath,
						toPath: plan.toPath,
						error,
					});
					results.push({
						sourceIndex,
						sourceType: source.type,
						status: 'failed',
						error,
					});
					sourceFailed = true;
					break;
				}
			}

			if (!sourceFailed) {
				results.push({
					sourceIndex,
					sourceType: source.type,
					status: 'synced',
				});
			}
		}
	} catch (error) {
		runError = error;
	}

	onProgress?.({ type: 'cleanup:start', tempDir });
	try {
		await tempDirs.remove(tempDir);
		onProgress?.({ type: 'cleanup:success', tempDir });
	} catch (error) {
		onProgress?.({ type: 'cleanup:failure', tempDir, error });
		throw error;
	}

	if (runError) {
		throw runError;
	}

	return { sources: results };
}
