import type { cp, mkdir, rm, stat } from 'node:fs/promises';
import * as path from 'node:path';
import type { Mapping } from '../schemas/mapping';

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
	sourcePath: string;
	configDir: string;
};

export type ApplyMappingOptions = {
	plan: MappingPlan;
	fileSystem: MappingFileSystem;
};

export function planMapping({
	mapping,
	sourcePath,
	configDir,
}: PlanMappingOptions): MappingPlan {
	const fromPath =
		'from' in mapping ? path.join(sourcePath, mapping.from) : sourcePath;
	const mapsToDirectory = mapping.to.endsWith('/') || mapping.to.endsWith('\\');
	const toPath =
		'from' in mapping && mapsToDirectory
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
