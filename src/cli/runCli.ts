import { runReferenceSyncCli } from '../runReferenceSyncCli';
import {
	getExplicitConfigPath,
	hasHelpRequest,
	isInitInvocation,
	validateArgv,
} from './argvValidation';
import { createProgram, outputInitHelp } from './createProgram';
import { runInitCli } from './runInitCli';

const DEFAULT_INIT_CONFIG_PATH = 'synctool.json';

export async function runCli(argv: string[]): Promise<number> {
	const userArgs = argv.slice(2);
	const validationError = validateArgv(userArgs);

	if (validationError) {
		console.error(validationError);
		return 1;
	}

	const program = createProgram();

	if (hasHelpRequest(userArgs)) {
		if (isInitInvocation(userArgs)) {
			outputInitHelp(program);
		} else {
			program.outputHelp();
		}
		return 0;
	}

	if (isInitInvocation(userArgs)) {
		const configPath =
			getExplicitConfigPath(userArgs) ?? DEFAULT_INIT_CONFIG_PATH;
		return runInitCli({ configPath });
	}

	const explicitConfigPath = getExplicitConfigPath(userArgs);

	return runReferenceSyncCli(
		explicitConfigPath === null
			? undefined
			: { configPath: explicitConfigPath },
	);
}
