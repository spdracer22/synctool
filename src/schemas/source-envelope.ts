import { z } from 'zod';
import type { FromToMappingSchema, ToMappingSchema } from './mapping';

type MappingSchema = typeof ToMappingSchema | typeof FromToMappingSchema;

export function SourceEnvelopeSchema<
	Type extends string,
	Shape extends z.ZodRawShape,
	Mappings extends MappingSchema,
>(type: Type, schema: z.ZodObject<Shape>, mappings: Mappings) {
	return schema.extend({
		type: z.literal(type),
		mappings: z.array(mappings),
	});
}
