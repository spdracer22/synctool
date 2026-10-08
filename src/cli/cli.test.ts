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
		const result = runSynctool(['init'], cwd);

		expect(result.exitCode).toBe(1);
		expect(result.stderr).toContain('unknown command');
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

	test('rejects repeated configuration options with a non-zero exit', async () => {
		const cwd = await createTempDir();
		const result = runSynctool(['--config=a.json', '--config=b.json'], cwd);

		expect(result.exitCode).toBe(1);
		expect(result.stderr).toContain('cannot be specified more than once');
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
