const HELP_FLAGS = new Set(['-h', '--help']);
const CONFIG_FLAGS = new Set(['-c', '--config']);

function isHelpFlag(arg: string): boolean {
	return HELP_FLAGS.has(arg);
}

function isConfigFlag(arg: string): boolean {
	return CONFIG_FLAGS.has(arg);
}

export function isHelpOnlyArgv(args: string[]): boolean {
	if (args.length === 0) {
		return false;
	}
	return args.every((arg) => isHelpFlag(arg));
}

export function hasHelpRequest(args: string[]): boolean {
	return args.some((arg) => isHelpFlag(arg));
}

export function formatArgvError(message: string): string {
	return `error: ${message}`;
}

function collectExplicitConfigPaths(args: string[]): string[] {
	const paths: string[] = [];

	for (let index = 0; index < args.length; index += 1) {
		const arg = args[index];
		if (arg === undefined) {
			continue;
		}

		if (arg.startsWith('--config=')) {
			paths.push(arg.slice('--config='.length));
			continue;
		}

		if (arg === '--config' || arg === '-c') {
			const value = args[index + 1];
			if (value !== undefined) {
				paths.push(value);
			}
			index += 1;
			continue;
		}

		if (arg.startsWith('-') && arg.length > 1 && !arg.startsWith('--')) {
			const shortArgs = arg.slice(1);
			for (const char of shortArgs) {
				if (char === 'c') {
					const value = args[index + 1];
					if (value !== undefined) {
						paths.push(value);
					}
					index += 1;
				}
			}
		}
	}

	return paths;
}

export function getExplicitConfigPath(args: string[]): string | null {
	return collectExplicitConfigPaths(args)[0] ?? null;
}

export function isInitInvocation(args: string[]): boolean {
	for (let index = 0; index < args.length; index += 1) {
		const arg = args[index];
		if (arg === undefined) {
			continue;
		}

		if (arg.startsWith('--config=')) {
			continue;
		}

		if (arg === '--config' || arg === '-c') {
			index += 1;
			continue;
		}

		if (arg.startsWith('-') && arg.length > 1 && !arg.startsWith('--')) {
			const shortArgs = arg.slice(1);
			for (const char of shortArgs) {
				if (char === 'c') {
					index += 1;
				}
			}
			continue;
		}

		if (arg === 'init') {
			return true;
		}
	}

	return false;
}

export function validateArgv(args: string[]): string | null {
	if (collectExplicitConfigPaths(args).length > 1) {
		return formatArgvError(
			"option '--config' cannot be specified more than once",
		);
	}

	let initCount = 0;

	for (let index = 0; index < args.length; index += 1) {
		const arg = args[index];
		if (arg === undefined) {
			continue;
		}

		if (arg === 'init') {
			initCount += 1;
			if (initCount > 1) {
				return formatArgvError('unexpected duplicate command `init`');
			}
			continue;
		}

		if (arg === '--') {
			const remainder = args.slice(index + 1);
			if (remainder.length > 0) {
				return formatArgvError(
					`unexpected argument \`${remainder[0]}\` after --`,
				);
			}
			return null;
		}

		if (arg.startsWith('--')) {
			if (arg.startsWith('--config=')) {
				const value = arg.slice('--config='.length);
				if (value.length === 0) {
					return formatArgvError("option '--config' requires an argument");
				}
				continue;
			}

			if (arg.includes('=')) {
				const optionName = arg.slice(0, arg.indexOf('='));
				return formatArgvError(`unknown option \`${optionName}\``);
			}

			if (isConfigFlag(arg)) {
				const value = args[index + 1];
				if (!value || value.startsWith('-')) {
					return formatArgvError(`option '${arg}' requires an argument`);
				}
				index += 1;
				continue;
			}

			if (!isHelpFlag(arg)) {
				return formatArgvError(`unknown option \`${arg}\``);
			}
			continue;
		}

		if (arg.startsWith('-')) {
			if (arg.length === 1) {
				return formatArgvError(`unknown option \`${arg}\``);
			}

			const shortArgs = arg.slice(1);
			for (const char of shortArgs) {
				const shortFlag = `-${char}`;

				if (isHelpFlag(shortFlag)) {
					continue;
				}

				if (char === 'c') {
					const value = args[index + 1];
					if (!value || value.startsWith('-')) {
						return formatArgvError("option '-c' requires an argument");
					}
					index += 1;
					continue;
				}

				return formatArgvError(`unknown option \`${shortFlag}\``);
			}
			continue;
		}

		return formatArgvError(`unknown command \`${arg}\``);
	}

	return null;
}
