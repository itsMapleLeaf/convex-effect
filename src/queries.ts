import type { GenericTableInfo, Query } from "convex/server"
import type { GenericId } from "convex/values"
import { Effect } from "effect"
import type { IndexValues } from "./indexes.ts"
import { QueryCtxService } from "./services.ts"
import {
	TableConfig,
	tableConfigFrom,
	type EffectTableConfig,
	type EffectTableDoc,
} from "./tables"

export function getFrom<Config extends EffectTableConfig>(
	definition: Record<typeof TableConfig, Config>,
	id: GenericId<Config["name"]>,
) {
	const config = tableConfigFrom(definition)
	return Effect.gen(function* () {
		const ctx = yield* QueryCtxService
		const doc = yield* Effect.promise(() => ctx.db.get(id))
		if (!doc) {
			return yield* Effect.fail(new DocNotFoundError(config.name, id))
		}
		return doc as EffectTableDoc<Config>
	})
}

export function queryFrom<Config extends EffectTableConfig>(
	definition: Record<typeof TableConfig, Config>,
) {
	const table = tableConfigFrom(definition)
	return new EffectQueryInitializer(table)
}

export class EffectQuery<Config extends EffectTableConfig> {
	constructor(
		protected readonly config: Config,
		protected readonly query: Effect.Effect<
			Query<GenericTableInfo>,
			never,
			QueryCtxService
		>,
	) {}

	first() {
		return Effect.gen(this, function* () {
			const query = yield* this.query
			const doc = yield* Effect.promise(() => query.first())
			if (!doc) {
				return yield* Effect.fail(new DocNotFoundError(this.config.name))
			}
			return doc as EffectTableDoc<Config>
		})
	}

	collect() {
		return Effect.gen(this, function* () {
			const query = yield* this.query
			const docs = yield* Effect.promise(() => query.collect())
			return docs as EffectTableDoc<Config>[]
		})
	}
}

export class EffectQueryInitializer<
	Config extends EffectTableConfig,
> extends EffectQuery<Config> {
	constructor(config: Config) {
		super(
			config,
			QueryCtxService.pipe(Effect.map((ctx) => ctx.db.query(config.name))),
		)
	}

	byIndex<Name extends Extract<keyof Config["indexes"], string>>(
		index: Name,
		...values: IndexValues<Config["indexes"][Name]>
	) {
		return new EffectQuery(
			this.config,
			Effect.gen(this, function* () {
				const ctx = yield* QueryCtxService
				const query = ctx.db.query(this.config.name)
				const indexEntries = this.config.indexes[index]
				return query.withIndex(
					index,
					// @ts-expect-error: this API is impossible to make typesafe with generics
					(builder) =>
						indexEntries.reduce(
							// @ts-expect-error: this API is impossible to make typesafe with generics
							(builder, entry, i) => builder.eq(entry.key, values[i]),
							builder,
						),
				)
			}),
		)
	}
}

export class DocNotFoundError<Table extends string> extends Error {
	readonly _tag = "DocNotFoundError"

	constructor(
		readonly table?: Table,
		readonly id?: GenericId<Table>,
	) {
		super(
			table && id
				? `couldn't find doc with id "${id}" in table "${table}"`
				: id
					? `couldn't find doc with id "${id}"`
					: table
						? `couldn't find doc in table "${table}"`
						: "couldn't find doc",
		)
	}
}
