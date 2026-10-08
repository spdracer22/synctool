import { Command } from 'commander';
import { formatHelpExamples } from './helpExamples';

function configureCommandTree(_program: Command): void {
	// Reserved for init and other subcommands (issues #8–#9).
}

export function createProgram(): Command {
	const program = new Command('synctool')
		.description(
			'Keep reference material in a project fresh while leaving adoption under your control.',
		)
		.option(
			'-c, --config <path>',
			'Use an explicit synctool.json path (configuration selection)',
		)
		.helpOption('-h, --help', 'Show CLI help and configuration examples.')
		.addHelpCommand(false)
		.configureHelp({
			sortSubcommands: true,
			sortOptions: true,
		})
		.addHelpText('after', `\n${formatHelpExamples()}\n`);

	configureCommandTree(program);

	return program;
}
