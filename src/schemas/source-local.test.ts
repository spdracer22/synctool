import { describe, expect, test } from 'bun:test';
import { LocalCopySourceSchema, LocalSourceSchema } from './source-local';

describe('local source schemas', () => {
	test('defaults local-copy operation to copy', () => {
		expect(
			LocalCopySourceSchema.parse({
				type: 'local-copy',
				path: '../shared',
				mappings: [{ from: 'skills', to: '.agents/skills' }],
			}),
		).toEqual({
			type: 'local-copy',
			path: '../shared',
			operation: 'copy',
			mappings: [{ from: 'skills', to: '.agents/skills' }],
		});
	});

	test('accepts local alias with symlink operation', () => {
		expect(
			LocalSourceSchema.parse({
				type: 'local',
				path: '../shared',
				operation: 'symlink',
				mappings: [{ from: 'skills', to: '.agents/skills' }],
			}),
		).toEqual({
			type: 'local',
			path: '../shared',
			operation: 'symlink',
			mappings: [{ from: 'skills', to: '.agents/skills' }],
		});
	});
});
