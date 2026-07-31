import { $ } from 'bun';
import type {
	MaterializedSource,
	SourceMaterializationProcesses,
} from '../lib/materializeSource';
import type { GitSource } from '../schemas/source-git';

async function defaultGitClone(repo: string, destinationPath: string) {
	await $`git clone --quiet --filter=blob:none "${repo}" "${destinationPath}"`;
}

export async function gitAdapter(
	source: GitSource,
	materializationDir: string,
	processes: Partial<Pick<SourceMaterializationProcesses, 'gitClone'>> = {},
): Promise<MaterializedSource> {
	await (processes.gitClone ?? defaultGitClone)(
		source.repo,
		materializationDir,
	);

	return {
		kind: 'folder',
		path: materializationDir,
		mappings: source.mappings,
	};
}
