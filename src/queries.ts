import type {
	ExpressionOrValue,
	FilterBuilder,
	GenericDocument,
	GenericTableInfo,
	OrderedQuery,
	PaginationOptions,
	PaginationResult,
} from "convex/server"
import type { GenericId } from "convex/values"
import { Effect, Effectable } from "effect"
import { QueryCtxService } from "./services.ts"
import {
	type EffectTableConfig,
	type EffectTableDoc,
	type TableConfig,
	tableConfigFrom,
} from "./tables"

export function fromTable<Config extends EffectTableConfig>(
	definition: Record<typeof TableConfig, Config>,
) {
	const config = tableConfigFrom(definition)
	return new PoolQuery(config)
}

type FilterCallback = (q: FilterBuilder<GenericTableInfo>) => ExpressionOrValue<boolean>

type QueryState = {
	readonly order: "asc" | "desc" | null
	readonly filters: readonly FilterCallback[]
}

export class PoolQuery<Config extends EffectTableConfig, Service = never> extends Effectable.Class<
	EffectTableDoc<Config>[],
	never,
	Service | QueryCtxService
> {
	constructor(
		private readonly config: Config,
		private readonly state: QueryState = {
			order: null,
			filters: [],
		},
	) {
		super()
	}

	order(direction: "asc" | "desc") {
		return this.withState({ ...this.state, order: direction })
	}

	filter(filter: FilterCallback) {
		return this.withState({
			...this.state,
			filters: [...this.state.filters, filter],
		})
	}

	get(id: GenericId<Config["name"]>) {
		return new ItemQuery(
			this.config,
			Effect.flatMap(QueryCtxService, (ctx) => Effect.promise(() => ctx.db.get(id))),
		)
	}

	first() {
		return new ItemQuery(
			this.config,
			Effect.flatMap(this.baseQuery, (query) => Effect.promise(() => query.first())),
		)
	}

	unique() {
		return new ItemQuery(
			this.config,
			Effect.flatMap(this.baseQuery, (query) => Effect.promise(() => query.unique())),
		)
	}

	collect() {
		return this.finalize((query) => query.collect() as Promise<EffectTableDoc<Config>[]>)
	}

	take(count: number) {
		return this.finalize((query) => query.take(count) as Promise<EffectTableDoc<Config>[]>)
	}

	paginate(options: PaginationOptions) {
		return this.finalize(
			(query) => query.paginate(options) as Promise<PaginationResult<EffectTableDoc<Config>>>,
		)
	}

	commit() {
		return this.collect()
	}

	private get baseQuery() {
		return QueryCtxService.pipe(
			Effect.map((ctx) => {
				// biome-ignore lint/suspicious/noImplicitAnyLet: shut
				let query
				query = ctx.db.query(this.config.name)
				for (const filter of this.state.filters) {
					query = query.filter(filter)
				}
				if (this.state.order) {
					query = query.order(this.state.order)
				}
				return query
			}),
		)
	}

	private withState(state: QueryState) {
		return new PoolQuery(this.config, state)
	}

	private finalize<Result>(next: (query: OrderedQuery<GenericTableInfo>) => Promise<Result>) {
		return Effect.flatMap(this.baseQuery, (query) => Effect.promise(() => next(query)))
	}
}

export class ItemQuery<Config extends EffectTableConfig, Error, Service> extends Effectable.Class<
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
