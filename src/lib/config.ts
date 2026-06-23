import { file } from 'bun';
import { findUp } from 'find-up';
import { ConfigSchema } from '../types/config.js';

export async function loadConfig() {
	const configFile = await findUp('synctool.json');

	if (!configFile) {
		throw new Error('synctool.json not found');
	}

	const jsonData = await file(configFile).json();
	const validated = ConfigSchema.parse(jsonData);

	return { ...validated, configPath: configFile };
}
