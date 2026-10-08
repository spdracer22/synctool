import { describe, expect, test } from 'bun:test';
import {
	getExplicitConfigPath,
	isHelpOnlyArgv,
	isInitInvocation,
	validateArgv,
} from './argvValidation';

describe('validateArgv', () => {
	test('accepts an empty invocation', () => {
		expect(validateArgv([])).toBeNull();
	});

	test('accepts help flags alone', () => {
		expect(validateArgv(['--help'])).toBeNull();
		expect(validateArgv(['-h'])).toBeNull();
		expect(validateArgv(['-h', '--help'])).toBeNull();
	});

	test('accepts init with configuration options before or after the command', () => {
		expect(validateArgv(['init'])).toBeNull();
		expect(validateArgv(['--config', './custom.json', 'init'])).toBeNull();
		expect(validateArgv(['init', '--config=./custom.json'])).toBeNull();
		expect(validateArgv(['-c', './custom.json', 'init'])).toBeNull();
		expect(validateArgv(['init', '-c', './custom.json'])).toBeNull();
	});

	test('rejects unknown commands', () => {
		expect(validateArgv(['wat'])).toBe('error: unknown command `wat`');
	});

	test('rejects extra positional arguments with init', () => {
		expect(validateArgv(['init', 'extra'])).toBe(
			'error: unknown command `extra`',
		);
		expect(validateArgv(['init', 'init'])).toBe(
			'error: unexpected duplicate command `init`',
		);
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

	test('rejects repeated configuration options', () => {
		expect(validateArgv(['--config=a.json', '--config=b.json'])).toBe(
			"error: option '--config' cannot be specified more than once",
		);
		expect(validateArgv(['-c', 'a.json', '--config=b.json'])).toBe(
			"error: option '--config' cannot be specified more than once",
		);
	});
});

describe('getExplicitConfigPath', () => {
	test('reads --config, --config=, and -c forms', () => {
		expect(getExplicitConfigPath(['--config', './sync.json'])).toBe(
			'./sync.json',
		);
		expect(getExplicitConfigPath(['--config=./sync.json'])).toBe('./sync.json');
		expect(getExplicitConfigPath(['-c', './sync.json'])).toBe('./sync.json');
	});

	test('returns null when no configuration option is present', () => {
		expect(getExplicitConfigPath([])).toBeNull();
		expect(getExplicitConfigPath(['--help'])).toBeNull();
	});
});

describe('isInitInvocation', () => {
	test('detects init without treating a configuration path named init as the command', () => {
		expect(isInitInvocation(['init'])).toBe(true);
		expect(isInitInvocation(['--config', 'init'])).toBe(false);
		expect(isInitInvocation(['--config=init'])).toBe(false);
		expect(isInitInvocation(['init', '--config=./custom.json'])).toBe(true);
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
