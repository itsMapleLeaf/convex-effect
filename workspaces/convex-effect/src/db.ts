import type {
	DocumentByInfo,
	DocumentByName,
	ExpressionOrValue,
	FilterBuilder,
	GenericDataModel,
	GenericDatabaseReader,
	GenericTableInfo,
	IndexNames,
	IndexRange,
	IndexRangeBuilder,
	NamedIndex,
	NamedSearchIndex,
	OrderedQuery,
	PaginationOptions,
	PaginationResult,
	Query,
	QueryInitializer,
	SearchFilter,
	SearchFilterBuilder,
	SearchIndexNames,
	TableNamesInDataModel,
} from "convex/server"
import type { GenericId } from "convex/values"
import { Data, Effect } from "effect"

export class EffectDatabaseReader<DataModel extends GenericDataModel> {
	readonly #db: GenericDatabaseReader<DataModel>

	constructor(db: GenericDatabaseReader<DataModel>) {
		this.#db = db
	}

	get<TableName extends TableNamesInDataModel<DataModel>>(
		id: GenericId<TableName>,
	): Effect.Effect<DocumentByName<DataModel, TableName>, DocNotFound, never> {
		return Effect.filterOrFail(
			Effect.promise(() => this.#db.get(id)),
			(doc): doc is DocumentByName<DataModel, TableName> => doc != null,
			() => new DocNotFound({ id }),
		)
	}

	normalizeId<TableName extends TableNamesInDataModel<DataModel>>(
		table: TableName,
		id: string,
	): Effect.Effect<GenericId<TableName>, InvalidId, never> {
		return Effect.filterOrFail(
			Effect.sync(() => this.#db.normalizeId(table, id)),
			(id): id is GenericId<TableName> => id != null,
			() => new InvalidId({ table, id }),
		)
	}

	query<TableName extends TableNamesInDataModel<DataModel>>(table: TableName) {
		return new EffectQueryInitializer(this.#db.query(table), table)
	}
}

export class OrderedEffectQuery<
	TableInfo extends GenericTableInfo,
	Q extends OrderedQuery<TableInfo>,
> {
	protected readonly query: Q
	protected readonly table: string

	constructor(query: Q, table: string) {
		this.query = query
		this.table = table
	}

	filter(
		predicate: (q: FilterBuilder<TableInfo>) => ExpressionOrValue<boolean>,
	) {
		return new OrderedEffectQuery(this.query.filter(predicate), this.table)
	}

	paginate(
		paginationOpts: PaginationOptions,
	): Effect.Effect<PaginationResult<DocumentByInfo<TableInfo>>, never, never> {
		return Effect.promise(() => this.query.paginate(paginationOpts))
	}

	collect(): Effect.Effect<Array<DocumentByInfo<TableInfo>>, never, never> {
		return Effect.promise(() => this.query.collect())
	}

	take(
		n: number,
	): Effect.Effect<Array<DocumentByInfo<TableInfo>>, never, never> {
		return Effect.promise(() => this.query.take(n))
	}

	first(): Effect.Effect<DocumentByInfo<TableInfo>, DocNotFound, never> {
		return Effect.filterOrFail(
			Effect.promise(() => this.query.first()),
			(doc): doc is DocumentByInfo<TableInfo> => doc != null,
			() => new DocNotFound({ table: this.table }),
		)
	}

	unique(): Effect.Effect<DocumentByInfo<TableInfo>, DocNotFound, never> {
		return Effect.filterOrFail(
			Effect.promise(() => this.query.unique()),
			(doc): doc is DocumentByInfo<TableInfo> => doc != null,
			() => new DocNotFound({ table: this.table }),
		)
	}
}

export class EffectQuery<
	TableInfo extends GenericTableInfo,
	Q extends Query<TableInfo>,
> extends OrderedEffectQuery<TableInfo, Q> {
	order(order: "asc" | "desc") {
		return new OrderedEffectQuery(this.query.order(order), this.table)
	}
}

export class EffectQueryInitializer<
	TableInfo extends GenericTableInfo,
> extends EffectQuery<TableInfo, QueryInitializer<TableInfo>> {
	fullTableScan() {
		return new EffectQuery(this.query.fullTableScan(), this.table)
	}

	withIndex<IndexName extends IndexNames<TableInfo>>(
		indexName: IndexName,
		indexRange?: (
			q: IndexRangeBuilder<
				DocumentByInfo<TableInfo>,
				NamedIndex<TableInfo, IndexName>
			>,
		) => IndexRange,
	) {
		return new EffectQuery(
			this.query.withIndex(indexName, indexRange),
			this.table,
		)
	}

	withSearchIndex<IndexName extends SearchIndexNames<TableInfo>>(
		indexName: IndexName,
		searchFilter: (
			q: SearchFilterBuilder<
				DocumentByInfo<TableInfo>,
				NamedSearchIndex<TableInfo, IndexName>
			>,
		) => SearchFilter,
	) {
		return new OrderedEffectQuery(
			this.query.withSearchIndex(indexName, searchFilter),
			this.table,
		)
	}
}

export class DocNotFound extends Data.TaggedError("DocNotFound")<{
	id?: GenericId<string>
	table?: string
}> {}

export class InvalidId extends Data.TaggedError("InvalidId")<{
	table: string
	id: string
}> {}
