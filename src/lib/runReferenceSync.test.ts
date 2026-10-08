import { describe, expect, test } from 'bun:test';
import { runReferenceSync } from './runReferenceSync';

describe('runReferenceSync', () => {
	test('returns immediately when sources are empty without temp directory work', async () => {
		let tempDirCreated = false;
		let materializeCalled = false;

		const result = await runReferenceSync({
			config: { sources: [], configPath: '/project/synctool.json' },
			configDir: '/project',
			onProgress: () => {
				throw new Error('progress should not be emitted for empty sources');
			},
			dependencies: {
				tempDirs: {
					create: async () => {
						tempDirCreated = true;
						return '/tmp/should-not-be-used';
					},
					remove: async () => {
						throw new Error(
							'temp dir should not be removed when none was created',
						);
					},
				},
				materializeSource: async () => {
					materializeCalled = true;
					throw new Error('materializeSource should not run');
				},
			},
		});

		expect(result).toEqual({ sources: [] });
		expect(tempDirCreated).toBe(false);
		expect(materializeCalled).toBe(false);
	});
});
