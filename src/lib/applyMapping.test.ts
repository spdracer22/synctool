import { describe, expect, test } from 'bun:test';
import type { PathLike } from 'node:fs';
import {
	cp,
	mkdir,
	mkdtemp,
	readlink,
	rm,
	stat,
	writeFile,
} from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import {
	applyMapping,
	type MappingFileSystem,
	planMapping,
} from './applyMapping';

function createFileSystem(
	overrides: Partial<MappingFileSystem> = {},
): MappingFileSystem {
	return {
		stat: (async () => ({})) as unknown as MappingFileSystem['stat'],
		rm: async () => undefined,
		mkdir: async () => undefined,
		cp: async () => undefined,
		...overrides,
	};
}

describe('planMapping', () => {
	test('resolves relative local source paths from the config directory', () => {
		const plan = planMapping({
			configDir: '/repo/subproject',
			materializedSource: {
				kind: 'folder',
				path: '../shared-reference',
				operation: 'symlink',
				mappings: [{ from: 'skills', to: '.agents/skills' }],
			},
			mapping: { from: './skills', to: '.agents/skills' },
		});

		expect(plan).toEqual({
			fromPath: '/repo/shared-reference/skills',
			toPath: '/repo/subproject/.agents/skills',
			operation: 'symlink',
		});
	});
});

describe('applyMapping', () => {
	test('copies mapping plans', async () => {
		const calls: string[] = [];
		const fileSystem = createFileSystem({
			stat: (async () => undefined) as unknown as MappingFileSystem['stat'],
			rm: async () => {
				calls.push('rm');
			},
			mkdir: async (dir) => {
				calls.push(`mkdir:${String(dir)}`);
				return undefined;
			},
			cp: async (from, to, options) => {
				calls.push(
					`cp:${String(from)}:${String(to)}:${JSON.stringify(options)}`,
				);
			},
		});

		await applyMapping({
			fileSystem,
			plan: {
				fromPath: '/repo/shared/skills',
				toPath: '/repo/.agents/skills',
				operation: 'copy',
			},
		});

		expect(calls).toEqual([
			'mkdir:/repo/.agents',
			'cp:/repo/shared/skills:/repo/.agents/skills:{"recursive":true}',
		]);
	});

	test('creates relative symlinks and replaces existing destinations', async () => {
		const calls: string[] = [];
		const fileSystem = createFileSystem({
			stat: (async (target: PathLike) => {
				calls.push(`stat:${String(target)}`);
				return {};
			}) as unknown as MappingFileSystem['stat'],
			rm: async (target, options) => {
				calls.push(`rm:${String(target)}:${JSON.stringify(options)}`);
			},
			mkdir: async (dir, options) => {
				calls.push(`mkdir:${String(dir)}:${JSON.stringify(options)}`);
				return undefined;
			},
		});
		const symlinks: Array<[string, string]> = [];

		await applyMapping({
			fileSystem,
			processes: {
				symlink: async (targetPath, linkPath) => {
					symlinks.push([targetPath, linkPath]);
				},
			},
			plan: {
				fromPath: '/repo/shared-reference/skills',
				toPath: '/repo/subproject/.agents/skills',
				operation: 'symlink',
			},
		});

		expect(calls).toEqual([
			'stat:/repo/subproject/.agents/skills',
			'stat:/repo/shared-reference/skills',
			'rm:/repo/subproject/.agents/skills:{"recursive":true,"force":true}',
			'mkdir:/repo/subproject/.agents:{"recursive":true}',
		]);
		expect(symlinks).toEqual([
			['../../shared-reference/skills', '/repo/subproject/.agents/skills'],
		]);
	});

	test('creates a real relative symlink with the default process', async () => {
		const tempDir = await mkdtemp(path.join(os.tmpdir(), 'synctool-test-'));

		try {
			const fromPath = path.join(tempDir, 'shared', 'skill.md');
			const toPath = path.join(tempDir, 'project', '.agents', 'skill.md');
			await mkdir(path.dirname(fromPath), { recursive: true });
			await writeFile(fromPath, 'skill');

			await applyMapping({
				fileSystem: { stat, rm, mkdir, cp },
				plan: { fromPath, toPath, operation: 'symlink' },
			});

			expect(await readlink(toPath)).toBe('../../shared/skill.md');
		} finally {
			await rm(tempDir, { recursive: true, force: true });
		}
	});
});
