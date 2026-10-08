import { describe, expect, test } from 'bun:test';
import { isHelpOnlyArgv, validateArgv } from './argvValidation';

describe('validateArgv', () => {
	test('accepts an empty invocation', () => {
		expect(validateArgv([])).toBeNull();
	});

	test('accepts help flags alone', () => {
		expect(validateArgv(['--help'])).toBeNull();
		expect(validateArgv(['-h'])).toBeNull();
		expect(validateArgv(['-h', '--help'])).toBeNull();
	});

	test('rejects unknown commands', () => {
		expect(validateArgv(['init'])).toBe('error: unknown command `init`');
	});

	test('rejects unknown options', () => {
		expect(validateArgv(['--verbose'])).toBe(
			'error: unknown option `--verbose`',
		);
	});

	test('rejects unknown options even when help is requested', () => {
		expect(validateArgv(['--help', '--verbose'])).toBe(
			'error: unknown option `--verbose`',
		);
		expect(validateArgv(['-h', '--wat'])).toBe('error: unknown option `--wat`');
	});

	test('rejects excess positional arguments', () => {
		expect(validateArgv(['--help', 'extra'])).toBe(
			'error: unknown command `extra`',
		);
	});

	test('requires values for configuration options', () => {
		expect(validateArgv(['--config'])).toBe(
			"error: option '--config' requires an argument",
		);
		expect(validateArgv(['-c'])).toBe(
			"error: option '-c' requires an argument",
		);
	});

	test('rejects unknown long options with values', () => {
		expect(validateArgv(['--config=./synctool.json'])).toBeNull();
		expect(validateArgv(['--wat=value'])).toBe('error: unknown option `--wat`');
	});
});

describe('isHelpOnlyArgv', () => {
	test('detects help-only requests', () => {
		expect(isHelpOnlyArgv(['--help'])).toBe(true);
		expect(isHelpOnlyArgv(['-h'])).toBe(true);
	});

	test('returns false for bare invocation', () => {
		expect(isHelpOnlyArgv([])).toBe(false);
	});
});
