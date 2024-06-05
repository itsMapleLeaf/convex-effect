import type { GenericTableInfo, OrderedQuery } from "convex/server"
import type { GenericId } from "convex/values"
import { Effect, pipe } from "effect"

export class DocNotFoundError<Table extends string> extends Error {
	readonly _tag = "DocNotFoundError"

	constructor(
		readonly table?: Table,
		readonly id?: GenericId<Table>,
	) {
		super(
			table && id
				? `couldn't find doc with id "${id}" in table "${table}"`
				: table
					? `couldn't find doc in table "${table}"`
					: "couldn't find doc",
		)
	}
}

export function first<TableInfo extends GenericTableInfo>(
	query: OrderedQuery<TableInfo>,
) {
	return pipe(
		Effect.promise(() => query.first()),
		Effect.flatMap(Effect.fromNullable),
		Effect.mapError(() => new DocNotFoundError()),
	)
}
