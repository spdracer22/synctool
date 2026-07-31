import { mkdir } from 'node:fs/promises';
import * as path from 'node:path';
import { randomUUIDv7 } from 'bun';
import type { FromToMapping, ToMapping } from '../schemas/mapping';
import type { Source } from '../schemas/source';
import { curlAdapter, getCurlDownloadFileName } from '../sources/curlAdapter';
import { gitAdapter } from '../sources/gitAdapter';
import { localCopyAdapter } from '../sources/localCopyAdapter';
import type { SourceContext } from './SourceContext';

export type MaterializedSource =
	| {
			kind: 'folder';
			path: string;
			mappings: FromToMapping[];
	  }
	| {
			kind: 'single-file';
			path: string;
			mappings: ToMapping[];
	  };

type FileSystem = {
	mkdir: typeof mkdir;
};

type TempNames = {
	create: () => string;
};

export type SourceMaterializationProcesses = {
	gitClone: (repo: string, destinationPath: string) => Promise<void>;
	curlDownload: (url: string, destinationPath: string) => Promise<void>;
};

export type SourceMaterializationDependencies = {
	fileSystem?: FileSystem;
	tempNames?: TempNames;
	processes?: Partial<SourceMaterializationProcesses>;
};

const defaultFileSystem: FileSystem = { mkdir };

const defaultTempNames: TempNames = {
	create: () => randomUUIDv7(),
};

async function createMaterializationDir({
	context,
	fileSystem,
	tempNames,
}: {
	context: SourceContext;
	fileSystem: FileSystem;
	tempNames: TempNames;
}): Promise<string> {
	const materializationDir = path.join(context.tempDir, tempNames.create());
	await fileSystem.mkdir(materializationDir, { recursive: true });
	return materializationDir;
}

async function createMaterializationFilePath({
	context,
	fileSystem,
	tempNames,
	fileName,
}: {
	context: SourceContext;
	fileSystem: FileSystem;
	tempNames: TempNames;
	fileName: string;
}): Promise<string> {
	const materializationDir = path.join(context.tempDir, tempNames.create());
	await fileSystem.mkdir(materializationDir, { recursive: true });
	return path.join(materializationDir, fileName);
}

export async function materializeSource(
	source: Source,
	context: SourceContext,
	dependencies: SourceMaterializationDependencies = {},
): Promise<MaterializedSource> {
	const fileSystem = dependencies.fileSystem ?? defaultFileSystem;
	const tempNames = dependencies.tempNames ?? defaultTempNames;

	switch (source.type) {
		case 'git': {
			const materializationDir = await createMaterializationDir({
				context,
				fileSystem,
				tempNames,
			});
			return gitAdapter(source, materializationDir, dependencies.processes);
		}
		case 'curl': {
			const materializationFilePath = await createMaterializationFilePath({
				context,
				fileSystem,
				tempNames,
				fileName: getCurlDownloadFileName(source),
			});
			return curlAdapter(
				source,
				materializationFilePath,
				dependencies.processes,
			);
		}
		case 'local-copy':
			return localCopyAdapter(source);
		default: {
			const exhaustive: never = source;
			throw new Error(`Unknown sync source type: ${exhaustive}`);
		}
	}
}
