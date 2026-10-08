import * as path from 'node:path';
import { file } from 'bun';
import { findUp } from 'find-up';
import { ZodError } from 'zod';
import { type Config, ConfigSchema } from '../schemas/config';

function formatConfigValidationError(
	configPath: string,
	error: ZodError,
): string {
	const detail = error.issues.map((issue) => issue.message).join('; ');
	return `Configuration is invalid (${configPath}): ${detail}`;
}

export function resolveExplicitConfigPath(configPath: string): string {
	return path.isAbsolute(configPath)
		? configPath
		: path.resolve(process.cwd(), configPath);
}

async function loadConfigAtResolvedPath(resolvedPath: string): Promise<Config> {
	const configFile = file(resolvedPath);

	if (!(await configFile.exists())) {
		throw new Error(`Configuration not found: ${resolvedPath}`);
	}

	let jsonData: unknown;
	try {
		jsonData = await configFile.json();
	} catch {
		throw new Error(`Configuration is not valid JSON: ${resolvedPath}`);
	}

	try {
		const validated = ConfigSchema.parse(jsonData);
		return { ...validated, configPath: resolvedPath };
	} catch (error) {
		if (error instanceof ZodError) {
			throw new Error(formatConfigValidationError(resolvedPath, error));
		}
		throw error;
	}
}

export async function loadConfigFromPath(configPath: string): Promise<Config> {
	return loadConfigAtResolvedPath(resolveExplicitConfigPath(configPath));
}

export async function loadConfig(): Promise<Config> {
	const configFile = await findUp('synctool.json');

	if (!configFile) {
		throw new Error('synctool.json not found');
	}

	return loadConfigAtResolvedPath(configFile);
}
