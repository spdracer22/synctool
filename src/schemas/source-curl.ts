import * as path from 'node:path';
import { z } from 'zod';
import { ToMappingSchema } from './mapping';

export const CurlInputSchema = z.object({
	url: z.url(),
	extension: z.string().optional(),
});

export function getCurlDownloadFileName(source: CurlInput): string {
	const urlPath = new URL(source.url).pathname;
	const urlFileName = path.basename(urlPath);

	if (urlFileName && path.extname(urlFileName)) {
		return urlFileName;
	}

	if (source.extension) {
		return `data${source.extension.startsWith('.') ? source.extension : `.${source.extension}`}`;
	}

	return 'data';
}

export const CurlSourceSchema = CurlInputSchema.extend({
	type: z.literal('curl'),
	mappings: z.array(ToMappingSchema),
}).transform((source) => ({
	...source,
	mappings: source.mappings.map((mapping) => {
		const toFileName = path.basename(mapping.to);

		return {
			...mapping,
			from: path.extname(toFileName)
				? toFileName
				: getCurlDownloadFileName(source),
		};
	}),
}));

export type CurlInput = z.infer<typeof CurlInputSchema>;
export type CurlSource = z.infer<typeof CurlSourceSchema>;
