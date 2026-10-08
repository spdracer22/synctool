import { Command } from 'commander';
import { emptySourcesConfigExample, formatHelpExamples } from './helpExamples';

function formatInitHelpExamples(): string {
	return `
Configuration example:

Empty sources (no-op reference sync run):

${emptySourcesConfigExample}
`.trimEnd();
}

function configureCommandTree(program: Command): void {
	program
		.command('init')
		.description(
			'Create a minimal configuration file with an empty sources list at the selected path.',
		)
		.helpOption(
			'-h, --help',
			'Show init help and the no-op configuration example.',
		)
		.addHelpText('after', `\n${formatInitHelpExamples()}\n`);
}

export function outputInitHelp(program: Command): void {
	const initCommand = program.commands.find(
		(command) => command.name() === 'init',
	);
	if (initCommand) {
		initCommand.outputHelp();
		return;
	}

	program.outputHelp();
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
