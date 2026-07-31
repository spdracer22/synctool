import type { cp, mkdir, rm, stat } from 'node:fs/promises';
import * as path from 'node:path';
import type { Mapping } from '../schemas/mapping';
import type { MaterializedSource } from './materializeSource';

export type MappingPlan = {
	fromPath: string;
	toPath: string;
};

export type MappingFileSystem = {
	stat: typeof stat;
	rm: typeof rm;
	mkdir: typeof mkdir;
	cp: typeof cp;
};

export type PlanMappingOptions = {
	mapping: Mapping;
	materializedSource: MaterializedSource;
	configDir: string;
};

export type ApplyMappingOptions = {
	plan: MappingPlan;
	fileSystem: MappingFileSystem;
};

export function planMapping({
	mapping,
	materializedSource,
	configDir,
}: PlanMappingOptions): MappingPlan {
	const mapsToDirectory = mapping.to.endsWith('/') || mapping.to.endsWith('\\');

	if (materializedSource.kind === 'single-file') {
		return {
			fromPath: materializedSource.path,
			toPath: mapsToDirectory
				? path.join(
						configDir,
						mapping.to,
						path.basename(materializedSource.path),
					)
				: path.join(configDir, mapping.to),
		};
	}

	if (!('from' in mapping)) {
		throw new Error(
			'Folder materializations require mappings with a from path',
		);
	}

	const fromPath = path.join(materializedSource.path, mapping.from);
	const toPath = mapsToDirectory
		? path.join(configDir, mapping.to, path.basename(mapping.from))
		: path.join(configDir, mapping.to);

	return { fromPath, toPath };
}

export async function applyMapping({
	plan,
	fileSystem,
}: ApplyMappingOptions): Promise<void> {
	const toExists =
		(await fileSystem.stat(plan.toPath, { throwIfNoEntry: false })) !==
		undefined;

	if (toExists) {
		await fileSystem.rm(plan.toPath, { recursive: true, force: true });
	}

	await fileSystem.mkdir(path.dirname(plan.toPath), { recursive: true });
	await fileSystem.cp(plan.fromPath, plan.toPath, { recursive: true });
}
