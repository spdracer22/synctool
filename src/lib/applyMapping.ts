import type { cp, mkdir, rm, stat } from 'node:fs/promises';
import * as path from 'node:path';
import { $ } from 'bun';
import type { Mapping } from '../schemas/mapping';
import type { MaterializedSource } from './materializeSource';

export type MappingPlan = {
	fromPath: string;
	toPath: string;
	operation: 'copy' | 'symlink';
};

export type MappingFileSystem = {
	stat: typeof stat;
	rm: typeof rm;
	mkdir: typeof mkdir;
	cp: typeof cp;
};

export type MappingProcesses = {
	symlink: (targetPath: string, linkPath: string) => Promise<void>;
};

export type PlanMappingOptions = {
	mapping: Mapping;
	materializedSource: MaterializedSource;
	configDir: string;
};

export type ApplyMappingOptions = {
	plan: MappingPlan;
	fileSystem: MappingFileSystem;
	processes?: Partial<MappingProcesses>;
};

async function defaultSymlink(targetPath: string, linkPath: string) {
	await $`ln -s "${targetPath}" "${linkPath}"`;
}

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
				? path.resolve(
						configDir,
						mapping.to,
						path.basename(materializedSource.path),
					)
				: path.resolve(configDir, mapping.to),
			operation: 'copy',
		};
	}

	if (!('from' in mapping)) {
		throw new Error(
			'Folder materializations require mappings with a from path',
		);
	}

	const materializedSourcePath = path.isAbsolute(materializedSource.path)
		? materializedSource.path
		: path.resolve(configDir, materializedSource.path);
	const fromPath = path.resolve(materializedSourcePath, mapping.from);
	const toPath = mapsToDirectory
		? path.resolve(configDir, mapping.to, path.basename(mapping.from))
		: path.resolve(configDir, mapping.to);

	return { fromPath, toPath, operation: materializedSource.operation };
}

export async function applyMapping({
	plan,
	fileSystem,
	processes = {},
}: ApplyMappingOptions): Promise<void> {
	const toExists =
		(await fileSystem.stat(plan.toPath, { throwIfNoEntry: false })) !==
		undefined;

	if (plan.operation === 'symlink') {
		await fileSystem.stat(plan.fromPath);
	}

	if (toExists) {
		await fileSystem.rm(plan.toPath, { recursive: true, force: true });
	}

	await fileSystem.mkdir(path.dirname(plan.toPath), { recursive: true });

	if (plan.operation === 'symlink') {
		const targetPath = path.relative(path.dirname(plan.toPath), plan.fromPath);
		await (processes.symlink ?? defaultSymlink)(targetPath, plan.toPath);
		return;
	}

	await fileSystem.cp(plan.fromPath, plan.toPath, { recursive: true });
}
