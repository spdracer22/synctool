import { describe, expect, test } from 'bun:test';
import { mkdtemp, writeFile } from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';

const indexPath = path.join(import.meta.dir, 'index.ts');

describe('synctool CLI', () => {
	test('reports empty sources and exits successfully without sync activity', async () => {
		const projectDir = await mkdtemp(path.join(os.tmpdir(), 'synctool-empty-'));
		await writeFile(
			path.join(projectDir, 'synctool.json'),
			JSON.stringify({ sources: [] }),
		);

		const proc = Bun.spawn(['bun', indexPath], {
			cwd: projectDir,
			stdout: 'pipe',
			stderr: 'pipe',
		});

		const [stdout, stderr, exitCode] = await Promise.all([
			new Response(proc.stdout).text(),
			new Response(proc.stderr).text(),
			proc.exited,
		]);

		expect(exitCode).toBe(0);
		expect(stdout.trim()).toBe('No sources configured; nothing to sync.');
		expect(stderr).not.toContain('Cleaning up');
		expect(stderr).not.toContain('Loading');
	});

	test('still validates configuration before reporting empty sources', async () => {
		const projectDir = await mkdtemp(
			path.join(os.tmpdir(), 'synctool-invalid-'),
		);
		await writeFile(
			path.join(projectDir, 'synctool.json'),
			JSON.stringify({ sources: [{ type: 'git', mappings: [] }] }),
		);

		const proc = Bun.spawn(['bun', indexPath], {
			cwd: projectDir,
			stdout: 'pipe',
			stderr: 'pipe',
		});

		const [stderr, exitCode] = await Promise.all([
			new Response(proc.stderr).text(),
			proc.exited,
		]);

		expect(exitCode).toBe(1);
		expect(stderr.length).toBeGreaterThan(0);
		expect(stderr).not.toContain('No sources configured');
	});
});
