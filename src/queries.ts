import type {
	GenericDocument,
	GenericTableInfo,
	OrderedQuery,
	Query,
} from "convex/server"
import type { GenericId } from "convex/values"
import { Effect, Effectable } from "effect"
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

export class OrderedPoolQuery<
	Config extends EffectTableConfig,
	Service = never,
> extends Effectable.Class<EffectTableDoc<Config>[], never, Service> {
	constructor(
		protected readonly config: Config,
		protected readonly baseQuery: Effect.Effect<
			OrderedQuery<GenericTableInfo>,
			never,
			Service
		>,
	) {
		super()
	}

	get(id: GenericId<Config["name"]>) {
		return new ItemQuery(
			this.config,
			Effect.flatMap(QueryCtxService, (ctx) =>
				Effect.promise(() => ctx.db.get(id)),
			),
		)
	}

	first() {
		return new ItemQuery(
			this.config,
			Effect.flatMap(this.baseQuery, (query) =>
				Effect.promise(() => query.first()),
			),
		)
	}

	collect() {
		return this.finalize((query) => query.collect())
	}

	take(count: number) {
		return this.finalize((query) => query.take(count))
	}

	commit() {
		return this.collect()
	}

	private finalize(
		next: (query: OrderedQuery<GenericTableInfo>) => Promise<GenericDocument[]>,
	) {
		return Effect.flatMap(this.baseQuery, (query) =>
			Effect.promise(async () => {
				const docs = await next(query)
				return docs as EffectTableDoc<Config>[]
			}),
		)
	}
}

export class PoolQuery<
	Config extends EffectTableConfig,
	Service = never,
> extends OrderedPoolQuery<Config, Service> {
	readonly baseQuery: Effect.Effect<Query<GenericTableInfo>, never, Service>

	constructor(
		config: Config,
		baseQuery: Effect.Effect<Query<GenericTableInfo>, never, Service>,
	) {
		super(config, baseQuery)
		this.baseQuery = baseQuery
	}

	order(direction: "asc" | "desc") {
		return new OrderedPoolQuery(
			this.config,
			Effect.map(this.baseQuery, (query) => query.order(direction)),
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
		return Effect.filterOrFail(
			this.doc,
			(doc): doc is EffectTableDoc<Config> => doc !== null,
			() => new DocNotFoundError(this.config.name),
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
