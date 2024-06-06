import type { GenericDocument, GenericTableInfo, Query } from "convex/server"
import type { GenericId } from "convex/values"
import { Effect, Effectable, pipe } from "effect"
import { QueryCtxService } from "./services.ts"
import {
	TableConfig,
	tableConfigFrom,
	type EffectTableConfig,
	type EffectTableDoc,
} from "./tables"

export function fromTable<Config extends EffectTableConfig>(
	definition: Record<typeof TableConfig, Config>,
) {
	const config = tableConfigFrom(definition)
	return new PoolQuery(
		config,
		QueryCtxService.pipe(Effect.map((ctx) => ctx.db.query(config.name))),
	)
}

export class PoolQuery<
	Config extends EffectTableConfig,
	Error = never,
	Service = never,
> extends Effectable.Class<EffectTableDoc<Config>[], Error, Service> {
	constructor(
		private readonly config: Config,
		private readonly baseQuery: Effect.Effect<
			Query<GenericTableInfo>,
			never,
			Service
		>,
	) {
		super()
	}

	commit() {
		return this.collect()
	}

	collect() {
		return Effect.gen(this, function* () {
			const query = yield* this.baseQuery
			const docs = yield* Effect.promise(() => query.collect())
			return docs as EffectTableDoc<Config>[]
		})
	}

	take(count: number) {
		return Effect.gen(this, function* () {
			const query = yield* this.baseQuery
			const docs = yield* Effect.promise(() => query.take(count))
			return docs as EffectTableDoc<Config>[]
		})
	}

	first() {
		return new ItemQuery(
			this.config,
			Effect.gen(this, function* () {
				const query = yield* this.baseQuery
				const doc = yield* Effect.promise(() => query.first())
				if (!doc) {
					return yield* Effect.fail(new DocNotFoundError(this.config.name))
				}
				return doc as EffectTableDoc<Config>
			}),
		)
	}

	get(id: GenericId<Config["name"]>) {
		return new ItemQuery(
			this.config,
			QueryCtxService.pipe(
				Effect.flatMap((ctx) => Effect.promise(() => ctx.db.get(id))),
			),
		)
	}
}

export class ItemQuery<
	Config extends EffectTableConfig,
	Error,
	Service,
> extends Effectable.Class<
	EffectTableDoc<Config>,
	Error | DocNotFoundError,
	Service
> {
	constructor(
		private readonly config: Config,
		private readonly doc: Effect.Effect<GenericDocument | null, Error, Service>,
	) {
		super()
	}

	commit() {
		return pipe(
			this.doc,
			Effect.flatMap((doc) =>
				doc
					? Effect.succeed(doc as EffectTableDoc<Config>)
					: Effect.fail(new DocNotFoundError(this.config.name)),
			),
		)
	}

	orNull() {
		return Effect.catchTag(this, "DocNotFoundError", () => Effect.succeed(null))
	}

	orDie() {
		return Effect.catchTag(this, "DocNotFoundError", Effect.die)
	}
}

export class DocNotFoundError extends Error {
	readonly _tag = "DocNotFoundError"

	constructor(
		readonly table?: string,
		readonly id?: string,
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
