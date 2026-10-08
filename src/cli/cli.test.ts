import { afterEach, describe, expect, test } from 'bun:test';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import {
	emptySourcesConfigExample,
	minimalLocalSourceExample,
} from './helpExamples';

const cliPath = path.join(import.meta.dir, '..', 'index.ts');

type CliResult = {
	exitCode: number;
	stdout: string;
	stderr: string;
};

function runSynctool(args: string[], cwd: string): CliResult {
	const result = Bun.spawnSync(['bun', cliPath, ...args], {
		cwd,
		env: { ...process.env, NO_COLOR: '1' },
		stdout: 'pipe',
		stderr: 'pipe',
	});

	return {
		exitCode: result.exitCode,
		stdout: result.stdout.toString(),
		stderr: result.stderr.toString(),
	};
}

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
	const tempDir = await mkdtemp(path.join(os.tmpdir(), 'synctool-cli-'));
	tempDirs.push(tempDir);
	return tempDir;
}

describe('synctool CLI', () => {
	test('--help exits successfully without a configuration', async () => {
		const cwd = await createTempDir();
		const result = runSynctool(['--help'], cwd);

		expect(result.exitCode).toBe(0);
		expect(result.stdout).toContain('Usage: synctool');
		expect(result.stdout).toContain(emptySourcesConfigExample.trim());
		expect(result.stdout).toContain(minimalLocalSourceExample.trim());
		expect(result.stderr).not.toContain('synctool.json not found');
	});

	test('-h exits successfully without a configuration', async () => {
		const cwd = await createTempDir();
		const result = runSynctool(['-h'], cwd);

		expect(result.exitCode).toBe(0);
		expect(result.stdout).toContain('Usage: synctool');
	});

	test('--help with an explicit config path does not load configuration', async () => {
		const cwd = await createTempDir();
		const result = runSynctool(['--help', '--config=missing.json'], cwd);

		expect(result.exitCode).toBe(0);
		expect(result.stdout).toContain('Usage: synctool');
		expect(result.stderr).not.toContain('synctool.json not found');
	});

	test('rejects unknown options with a non-zero exit', async () => {
		const cwd = await createTempDir();
		const result = runSynctool(['--wat'], cwd);

		expect(result.exitCode).toBe(1);
		expect(result.stderr).toContain('unknown option');
	});

	test('rejects unknown commands with a non-zero exit', async () => {
		const cwd = await createTempDir();
		const result = runSynctool(['wat'], cwd);

		expect(result.exitCode).toBe(1);
		expect(result.stderr).toContain('unknown command');
	});

	test('root help lists init', async () => {
		const cwd = await createTempDir();
		const result = runSynctool(['--help'], cwd);

		expect(result.exitCode).toBe(0);
		expect(result.stdout).toContain('init');
		expect(result.stdout).toContain('Empty sources');
	});

	test('rejects missing configuration option values with a non-zero exit', async () => {
		const cwd = await createTempDir();
		const result = runSynctool(['--config'], cwd);

		expect(result.exitCode).toBe(1);
		expect(result.stderr).toContain('requires an argument');
	});

	test('rejects malformed arguments even when help is requested', async () => {
		const cwd = await createTempDir();
		const result = runSynctool(['--help', '--wat'], cwd);

		expect(result.exitCode).toBe(1);
		expect(result.stderr).toContain('unknown option');
	});

	test('explicit configuration resolves relative paths from the working directory', async () => {
		const projectDir = await createTempDir();
		const configDir = path.join(projectDir, 'configs');
		const nestedDir = path.join(projectDir, 'nested');
		await mkdir(configDir, { recursive: true });
		await mkdir(nestedDir, { recursive: true });

		const sourceDir = path.join(projectDir, 'source');
		await mkdir(path.join(sourceDir, 'skills'), { recursive: true });
		await writeFile(path.join(sourceDir, 'skills', 'example.txt'), 'hello');

		await writeFile(
			path.join(projectDir, 'synctool.json'),
			JSON.stringify({
				sources: [
					{
						type: 'local',
						path: sourceDir,
						mappings: [{ from: 'skills', to: 'refs/parent-only' }],
					},
				],
			}),
		);

		await writeFile(
			path.join(configDir, 'sync.json'),
			JSON.stringify({
				sources: [
					{
						type: 'local',
						path: sourceDir,
						mappings: [{ from: 'skills', to: 'refs/explicit' }],
					},
				],
			}),
		);

		const result = runSynctool(
			['--config', path.join('..', 'configs', 'sync.json')],
			nestedDir,
		);

		expect(result.exitCode).toBe(0);
		expect(
			await Bun.file(
				path.join(configDir, 'refs', 'explicit', 'example.txt'),
			).exists(),
		).toBe(true);
		expect(
			await Bun.file(
				path.join(projectDir, 'refs', 'parent-only', 'example.txt'),
			).exists(),
		).toBe(false);
	});

	test('explicit configuration does not discover synctool.json upward', async () => {
		const projectDir = await createTempDir();
		const nestedDir = path.join(projectDir, 'nested');
		await mkdir(nestedDir, { recursive: true });

		await writeFile(
			path.join(projectDir, 'synctool.json'),
			JSON.stringify({ sources: [] }),
		);

		const result = runSynctool(['--config', 'missing.json'], nestedDir);

		expect(result.exitCode).toBe(1);
		expect(result.stderr).toContain('Configuration not found');
		expect(result.stderr).not.toContain('synctool.json not found');
	});

	test('explicit configuration accepts an absolute path', async () => {
		const projectDir = await createTempDir();
		const sourceDir = path.join(projectDir, 'source');
		await mkdir(path.join(sourceDir, 'skills'), { recursive: true });
		await writeFile(path.join(sourceDir, 'skills', 'example.txt'), 'hello');

		const configPath = path.join(projectDir, 'custom.json');
		await writeFile(
			configPath,
			JSON.stringify({
				sources: [
					{
						type: 'local',
						path: sourceDir,
						mappings: [{ from: 'skills', to: 'refs/skills' }],
					},
				],
			}),
		);

		const result = runSynctool(['-c', configPath], projectDir);

		expect(result.exitCode).toBe(0);
		expect(
			await Bun.file(
				path.join(projectDir, 'refs', 'skills', 'example.txt'),
			).exists(),
		).toBe(true);
	});

	test('explicit invalid configuration exits with a helpful error', async () => {
		const cwd = await createTempDir();
		await writeFile(path.join(cwd, 'broken.json'), '{ not json');

		const result = runSynctool(['--config=broken.json'], cwd);

		expect(result.exitCode).toBe(1);
		expect(result.stderr).toContain('Configuration is not valid JSON');
	});

	test('rejects repeated configuration options with a non-zero exit', async () => {
		const cwd = await createTempDir();
		const result = runSynctool(['--config=a.json', '--config=b.json'], cwd);

		expect(result.exitCode).toBe(1);
		expect(result.stderr).toContain('cannot be specified more than once');
	});

	describe('init', () => {
		test('creates synctool.json in the current directory with an empty sources list', async () => {
			const cwd = await createTempDir();
			const result = runSynctool(['init'], cwd);

			expect(result.exitCode).toBe(0);
			expect(result.stdout).toContain('Created configuration:');

			const configPath = path.join(cwd, 'synctool.json');
			expect(await Bun.file(configPath).exists()).toBe(true);
			expect(JSON.parse(await Bun.file(configPath).text())).toEqual({
				sources: [],
			});
		});

		test('creates a custom target when --config is provided before init', async () => {
			const cwd = await createTempDir();
			await mkdir(path.join(cwd, 'configs'), { recursive: true });

			const result = runSynctool(
				['--config', 'configs/sync.json', 'init'],
				cwd,
			);

			expect(result.exitCode).toBe(0);

			const configPath = path.join(cwd, 'configs', 'sync.json');
			expect(JSON.parse(await Bun.file(configPath).text())).toEqual({
				sources: [],
			});
		});

		test('creates a custom target when --config= is provided after init', async () => {
			const cwd = await createTempDir();
			await mkdir(path.join(cwd, 'configs'), { recursive: true });

			const result = runSynctool(['init', '--config=configs/sync.json'], cwd);

			expect(result.exitCode).toBe(0);
			expect(
				JSON.parse(
					await Bun.file(path.join(cwd, 'configs', 'sync.json')).text(),
				),
			).toEqual({ sources: [] });
		});

		test('does not treat a configuration file named init as the init subcommand', async () => {
			const cwd = await createTempDir();
			await writeFile(path.join(cwd, 'init'), JSON.stringify({ sources: [] }));

			const result = runSynctool(['--config', 'init'], cwd);

			expect(result.exitCode).toBe(0);
			expect(await Bun.file(path.join(cwd, 'synctool.json')).exists()).toBe(
				false,
			);
		});

		test('creates a custom target when -c is provided after init', async () => {
			const cwd = await createTempDir();
			await mkdir(path.join(cwd, 'configs'), { recursive: true });

			const result = runSynctool(['init', '-c', 'configs/sync.json'], cwd);

			expect(result.exitCode).toBe(0);
			expect(
				JSON.parse(
					await Bun.file(path.join(cwd, 'configs', 'sync.json')).text(),
				),
			).toEqual({ sources: [] });
		});

		test('does not discover parent synctool.json when initializing a nested directory', async () => {
			const projectDir = await createTempDir();
			const nestedDir = path.join(projectDir, 'nested');
			await mkdir(nestedDir, { recursive: true });

			await writeFile(
				path.join(projectDir, 'synctool.json'),
				JSON.stringify({
					sources: [
						{
							type: 'local',
							path: projectDir,
							mappings: [{ from: '.', to: 'refs/parent' }],
						},
					],
				}),
			);

			const result = runSynctool(['init'], nestedDir);

			expect(result.exitCode).toBe(0);
			expect(
				await Bun.file(path.join(nestedDir, 'synctool.json')).exists(),
			).toBe(true);
			expect(
				await Bun.file(path.join(projectDir, 'refs', 'parent')).exists(),
			).toBe(false);
		});

		test('concurrent initialization cannot overwrite an existing file', async () => {
			const cwd = await createTempDir();
			const configPath = path.join(cwd, 'synctool.json');

			const first = runSynctool(['init'], cwd);
			const second = runSynctool(['init'], cwd);

			expect(first.exitCode).toBe(0);
			expect(first.stdout).toContain('Created configuration:');
			expect(second.exitCode).toBe(0);
			expect(second.stdout).toContain('Configuration already exists:');
			expect(JSON.parse(await Bun.file(configPath).text())).toEqual({
				sources: [],
			});
		});

		test('leaves an existing configuration untouched and exits successfully', async () => {
			const cwd = await createTempDir();
			const configPath = path.join(cwd, 'synctool.json');
			const existing =
				'{\n  "sources": [{"type":"local","path":".","mappings":[]}]\n}\n';
			await writeFile(configPath, existing);

			const result = runSynctool(['init'], cwd);

			expect(result.exitCode).toBe(0);
			expect(result.stdout).toContain('Configuration already exists:');
			expect(await Bun.file(configPath).text()).toBe(existing);
		});

		test('reports missing parent directories without creating them', async () => {
			const cwd = await createTempDir();
			const result = runSynctool(
				['init', '--config', 'missing-parent/synctool.json'],
				cwd,
			);

			expect(result.exitCode).toBe(1);
			expect(result.stderr).toContain('parent directory does not exist');
			expect(await Bun.file(path.join(cwd, 'missing-parent')).exists()).toBe(
				false,
			);
		});

		test('init help shows the no-op configuration example without creating a file', async () => {
			const cwd = await createTempDir();
			const result = runSynctool(['init', '--help'], cwd);

			expect(result.exitCode).toBe(0);
			expect(result.stdout).toContain(emptySourcesConfigExample.trim());
			expect(await Bun.file(path.join(cwd, 'synctool.json')).exists()).toBe(
				false,
			);
		});

		test('init does not start a reference sync run', async () => {
			const cwd = await createTempDir();
			const sourceDir = path.join(cwd, 'source');
			await mkdir(path.join(sourceDir, 'skills'), { recursive: true });
			await writeFile(path.join(sourceDir, 'skills', 'example.txt'), 'hello');

			await writeFile(
				path.join(cwd, 'synctool.json'),
				JSON.stringify({
					sources: [
						{
							type: 'local',
							path: sourceDir,
							mappings: [{ from: 'skills', to: 'refs/skills' }],
						},
					],
				}),
			);

			const nestedDir = path.join(cwd, 'nested');
			await mkdir(nestedDir, { recursive: true });

			const result = runSynctool(['init'], nestedDir);

			expect(result.exitCode).toBe(0);
			expect(
				await Bun.file(
					path.join(cwd, 'refs', 'skills', 'example.txt'),
				).exists(),
			).toBe(false);
		});

		test('an initialized empty configuration performs a no-op reference sync run', async () => {
			const cwd = await createTempDir();
			const initResult = runSynctool(['init'], cwd);
			expect(initResult.exitCode).toBe(0);

			const syncResult = runSynctool([], cwd);
			expect(syncResult.exitCode).toBe(0);
			expect(syncResult.stderr).not.toContain('Loading');
			expect(syncResult.stderr).not.toContain('Syncing');
		});
	});

	test('bare invocation discovers configuration upward and exits non-zero for failed sources', async () => {
		const projectDir = await createTempDir();
		const nestedDir = path.join(projectDir, 'nested');
		await mkdir(nestedDir, { recursive: true });

		const goodSourceDir = path.join(projectDir, 'good-source');
		await mkdir(path.join(goodSourceDir, 'skills'), { recursive: true });
		await writeFile(path.join(goodSourceDir, 'skills', 'example.txt'), 'hello');

		const badSourceDir = path.join(projectDir, 'bad-source');
		await mkdir(badSourceDir, { recursive: true });

		await writeFile(
			path.join(projectDir, 'synctool.json'),
			JSON.stringify({
				sources: [
					{
						type: 'local',
						path: badSourceDir,
						mappings: [{ from: 'missing', to: 'refs/missing' }],
					},
					{
						type: 'local',
						path: goodSourceDir,
						mappings: [{ from: 'skills', to: 'refs/skills' }],
					},
				],
			}),
		);

		const result = runSynctool([], nestedDir);

		expect(result.exitCode).toBe(1);
		expect(result.stderr).not.toContain('synctool.json not found');
		expect(
			await Bun.file(
				path.join(projectDir, 'refs', 'skills', 'example.txt'),
			).exists(),
		).toBe(true);
	});
});
