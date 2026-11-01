import { z } from "zod/mini";

/** Typed search params for /examples/search (TanStack validateSearch + Zod v4 mini).
 *  Note: zod/mini uses z._default() — `default` is a JS reserved word. */
export const migrationSearchSchema = z.object({
  view: z.optional(z._default(z.enum(["list", "grid"]), "list")),
  q: z.optional(z.string()),
});

export type MigrationSearch = z.infer<typeof migrationSearchSchema>;
