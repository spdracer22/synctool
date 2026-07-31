import { describe, expect, test } from 'bun:test';
import { materializeSource } from './materializeSource';

describe('materializeSource', () => {
	test('materializes git sources into a prepared directory', async () => {
		const mkdirCalls: Array<[string, unknown]> = [];
		const gitCloneCalls: Array<[string, string]> = [];

		const result = await materializeSource(
			{
				type: 'git',
				repo: 'https://example.com/repo.git',
				mappings: [{ from: 'docs', to: 'references/docs' }],
			},
			{ tempDir: '/tmp/synctool-run' },
			{
				fileSystem: {
					mkdir: async (dir, options) => {
						mkdirCalls.push([String(dir), options]);
						return undefined;
					},
				},
				tempNames: { create: () => 'source-a' },
				processes: {
					gitClone: async (repo, destinationPath) => {
						gitCloneCalls.push([repo, destinationPath]);
					},
				},
			},
		);

		expect(result).toEqual({
			kind: 'folder',
			path: '/tmp/synctool-run/source-a',
			mappings: [{ from: 'docs', to: 'references/docs' }],
		});
		expect(mkdirCalls).toEqual([
			['/tmp/synctool-run/source-a', { recursive: true }],
		]);
		expect(gitCloneCalls).toEqual([
			['https://example.com/repo.git', '/tmp/synctool-run/source-a'],
		]);
	});

	test('materializes curl sources and returns concrete mappings', async () => {
		const curlDownloadCalls: Array<[string, string]> = [];

		const result = await materializeSource(
			{
				type: 'curl',
				url: 'https://example.com/spec',
				extension: 'yaml',
				mappings: [
					{ to: 'references/spec/' },
					{ to: 'references/spec/spec.yaml' },
					{ to: 'references/again/' },
				],
			},
			{ tempDir: '/tmp/synctool-run' },
			{
				fileSystem: { mkdir: async () => undefined },
				tempNames: { create: () => 'source-b' },
				processes: {
					curlDownload: async (url, destinationPath) => {
						curlDownloadCalls.push([url, destinationPath]);
					},
				},
			},
		);

		expect(result).toEqual({
			kind: 'single-file',
			path: '/tmp/synctool-run/source-b/data.yaml',
			mappings: [
				{ to: 'references/spec/' },
				{ to: 'references/spec/spec.yaml' },
				{ to: 'references/again/' },
			],
		});
		expect(curlDownloadCalls).toEqual([
			['https://example.com/spec', '/tmp/synctool-run/source-b/data.yaml'],
		]);
	});

	test('materializes local-copy sources by returning their path', async () => {
		const mkdirCalls: string[] = [];

		const result = await materializeSource(
			{
				type: 'local-copy',
				path: 'references/local',
				mappings: [{ from: 'skills', to: '.agents/skills' }],
			},
			{ tempDir: '/tmp/synctool-run' },
			{
				fileSystem: {
					mkdir: async (dir) => {
						mkdirCalls.push(String(dir));
						return undefined;
					},
				},
			},
		);

		expect(result).toEqual({
			kind: 'folder',
			path: 'references/local',
			mappings: [{ from: 'skills', to: '.agents/skills' }],
		});
		expect(mkdirCalls).toEqual([]);
	});
});
