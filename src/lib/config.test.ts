import { afterEach, describe, expect, test } from 'bun:test';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { loadConfigFromPath, resolveExplicitConfigPath } from './config';

const tempDirs: string[] = [];

afterEach(async () => {
	while (tempDirs.length > 0) {
		const tempDir = tempDirs.pop();
		if (tempDir) {
			await rm(tempDir, { recursive: true, force: true });
		}
	}
});

async function createTempDir(): Promise<string> {
	const tempDir = await mkdtemp(path.join(os.tmpdir(), 'synctool-config-'));
	tempDirs.push(tempDir);
	return tempDir;
}

describe('resolveExplicitConfigPath', () => {
	test('resolves relative paths from the current working directory', async () => {
		const cwd = await createTempDir();
		const configDir = path.join(cwd, 'configs');
		await mkdir(configDir, { recursive: true });

		const previousCwd = process.cwd();
		process.chdir(cwd);
		try {
			const resolved = resolveExplicitConfigPath('configs/sync.json');
			expect(resolved.endsWith(`${path.sep}configs${path.sep}sync.json`)).toBe(
				true,
			);
			expect(path.basename(path.dirname(resolved))).toBe('configs');
		} finally {
			process.chdir(previousCwd);
		}
	});

	test('preserves absolute paths', async () => {
		const absolutePath = path.join(os.tmpdir(), 'synctool-abs.json');
		expect(resolveExplicitConfigPath(absolutePath)).toBe(absolutePath);
	});
});

describe('loadConfigFromPath', () => {
	test('loads a valid configuration from an explicit path', async () => {
		const cwd = await createTempDir();
		const configPath = path.join(cwd, 'custom.json');
		await writeFile(
			configPath,
			JSON.stringify({
				sources: [],
			}),
		);

		const previousCwd = process.cwd();
		process.chdir(cwd);
		try {
			const config = await loadConfigFromPath('custom.json');
			expect(config.configPath).toBe(resolveExplicitConfigPath('custom.json'));
			expect(config.sources).toEqual([]);
		} finally {
			process.chdir(previousCwd);
		}
	});

	test('fails when the configuration file is missing', async () => {
		const cwd = await createTempDir();
		const previousCwd = process.cwd();
		process.chdir(cwd);
		try {
			await expect(loadConfigFromPath('missing.json')).rejects.toThrow(
				'Configuration not found',
			);
		} finally {
			process.chdir(previousCwd);
		}
	});

	test('fails when the configuration file is invalid JSON', async () => {
		const cwd = await createTempDir();
		await writeFile(path.join(cwd, 'broken.json'), '{ not json');

		const previousCwd = process.cwd();
		process.chdir(cwd);
		try {
			await expect(loadConfigFromPath('broken.json')).rejects.toThrow(
				'Configuration is not valid JSON',
			);
		} finally {
			process.chdir(previousCwd);
		}
	});

	test('fails when the configuration does not match the schema', async () => {
		const cwd = await createTempDir();
		await writeFile(path.join(cwd, 'invalid.json'), JSON.stringify({ wat: 1 }));

		const previousCwd = process.cwd();
		process.chdir(cwd);
		try {
			await expect(loadConfigFromPath('invalid.json')).rejects.toThrow(
				'Configuration is invalid',
			);
		} finally {
			process.chdir(previousCwd);
		}
	});
});
