import { z } from 'zod';
import { MappingSchema } from './mapping';

export function SourceEnvelopeSchema<
	Type extends string,
	Shape extends z.ZodRawShape,
>(type: Type, schema: z.ZodObject<Shape>) {
	return schema.extend({
		type: z.literal(type),
		mappings: z.array(MappingSchema),
	});
}
