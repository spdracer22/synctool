import { runReferenceSyncCli } from '../runReferenceSyncCli';
import {
	getExplicitConfigPath,
	hasHelpRequest,
	validateArgv,
} from './argvValidation';
import { createProgram } from './createProgram';

export async function runCli(argv: string[]): Promise<number> {
	const userArgs = argv.slice(2);
	const validationError = validateArgv(userArgs);

	if (validationError) {
		console.error(validationError);
		return 1;
	}

	if (hasHelpRequest(userArgs)) {
		createProgram().outputHelp();
		return 0;
	}

	const explicitConfigPath = getExplicitConfigPath(userArgs);

	return runReferenceSyncCli(
		explicitConfigPath === null
			? undefined
			: { configPath: explicitConfigPath },
	);
}
