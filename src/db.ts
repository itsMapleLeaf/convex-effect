import type {
	DocumentByInfo,
	DocumentByName,
	ExpressionOrValue,
	FilterBuilder,
	GenericDataModel,
	GenericDatabaseReader,
	GenericDatabaseWriter,
	GenericTableInfo,
	IndexNames,
	IndexRange,
	IndexRangeBuilder,
	NamedIndex,
	NamedSearchIndex,
	NamedTableInfo,
	OrderedQuery,
	PaginationOptions,
	PaginationResult,
	Query,
	QueryInitializer,
	SearchFilter,
	SearchFilterBuilder,
	SearchIndexNames,
	TableNamesInDataModel,
	WithOptionalSystemFields,
	WithoutSystemFields,
} from "convex/server"
import type { GenericId } from "convex/values"
import { Effect } from "effect"
import type { DistributedOmit } from "type-fest"
import { ConvexEffectError } from "./errors.ts"

export type BaseDatabaseReader<DataModel extends GenericDataModel> =
	DistributedOmit<GenericDatabaseReader<DataModel>, "system">

export class EffectDatabaseReader<DataModel extends GenericDataModel> {
	protected readonly db: BaseDatabaseReader<DataModel>

	constructor(db: Omit<GenericDatabaseReader<DataModel>, "system">) {
		this.db = db
	}

	get<TableName extends TableNamesInDataModel<DataModel>>(
		id: GenericId<TableName>,
	): Effect.Effect<
		DocumentByName<DataModel, TableName>,
		DocNotFoundById<TableName>,
		never
	> {
		return Effect.filterOrFail(
			this.getOrNull(id),
			(doc): doc is DocumentByName<DataModel, TableName> => doc != null,
			() => new DocNotFoundById(id),
		)
	}

	getOrNull<TableName extends TableNamesInDataModel<DataModel>>(
		id: GenericId<TableName>,
	): Effect.Effect<DocumentByName<DataModel, TableName> | null, never, never> {
		return Effect.promise(() => this.db.get(id))
	}

	normalizeId<TableName extends TableNamesInDataModel<DataModel>>(
		table: TableName,
		id: string,
	): Effect.Effect<GenericId<TableName>, InvalidId<TableName>, never> {
		return Effect.filterOrFail(
			this.normalizeIdOrNull(table, id),
			(id): id is GenericId<TableName> => id != null,
			() => new InvalidId(table, id),
		)
	}

	normalizeIdOrNull<TableName extends TableNamesInDataModel<DataModel>>(
		table: TableName,
		id: string,
	): Effect.Effect<GenericId<TableName> | null, never, never> {
		return Effect.sync(() => this.db.normalizeId(table, id))
	}

	query<TableName extends TableNamesInDataModel<DataModel>>(
		table: TableName,
	): EffectQueryInitializer<NamedTableInfo<DataModel, TableName>, TableName> {
		return new EffectQueryInitializer(this.db.query(table), table)
	}
}

export class OrderedEffectQuery<
	TableInfo extends GenericTableInfo,
	Table extends string,
> {
	protected readonly query: OrderedQuery<TableInfo>
	protected readonly table: Table

	constructor(query: OrderedQuery<TableInfo>, table: Table) {
		this.query = query
		this.table = table
	}

	filter(
		predicate: (q: FilterBuilder<TableInfo>) => ExpressionOrValue<boolean>,
	): OrderedEffectQuery<TableInfo, Table> {
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

	first(): Effect.Effect<
		DocumentByInfo<TableInfo>,
		DocNotFoundInTable<Table>,
		never
	> {
		return Effect.filterOrFail(
			Effect.promise(() => this.query.first()),
			(doc): doc is DocumentByInfo<TableInfo> => doc != null,
			() => new DocNotFoundInTable(this.table),
		)
	}

	firstOrNull(): Effect.Effect<DocumentByInfo<TableInfo> | null, never, never> {
		return Effect.promise(() => this.query.first())
	}

	unique(): Effect.Effect<
		DocumentByInfo<TableInfo>,
		DocNotFoundInTable<Table>,
		never
	> {
		return Effect.filterOrFail(
			this.uniqueOrNull(),
			(doc): doc is DocumentByInfo<TableInfo> => doc != null,
			() => new DocNotFoundInTable(this.table),
		)
	}

	uniqueOrNull(): Effect.Effect<
		DocumentByInfo<TableInfo> | null,
		never,
		never
	> {
		return Effect.promise(() => this.query.unique())
	}
}

export class EffectQuery<
	TableInfo extends GenericTableInfo,
	Table extends string,
> extends OrderedEffectQuery<TableInfo, Table> {
	override readonly query: Query<TableInfo>

	constructor(query: Query<TableInfo>, table: Table) {
		super(query, table)
		this.query = query
	}

	order(order: "asc" | "desc"): OrderedEffectQuery<TableInfo, Table> {
		return new OrderedEffectQuery(this.query.order(order), this.table)
	}
}

export class EffectQueryInitializer<
	TableInfo extends GenericTableInfo,
	Table extends string,
> extends EffectQuery<TableInfo, Table> {
	override readonly query: QueryInitializer<TableInfo>

	constructor(query: QueryInitializer<TableInfo>, table: Table) {
		super(query, table)
		this.query = query
	}

	fullTableScan(): EffectQuery<TableInfo, Table> {
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
	): EffectQuery<TableInfo, Table> {
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
	): OrderedEffectQuery<TableInfo, Table> {
		return new OrderedEffectQuery(
			this.query.withSearchIndex(indexName, searchFilter),
			this.table,
		)
	}
}

export class DocNotFoundInTable<T extends string> extends ConvexEffectError {
	// biome-ignore lint/style: workaround for typegen bug
	readonly _tag: "DocNotFoundInTable" = "DocNotFoundInTable"

	constructor(readonly table: T) {
		super(`No document found in table "${table}".`)
	}
}

export class DocNotFoundById<T extends string> extends ConvexEffectError {
	// biome-ignore lint/style: workaround for typegen bug
	readonly _tag: "DocNotFoundById" = "DocNotFoundById"

	constructor(readonly id: GenericId<T>) {
		super(`No document found with id "${id}".`)
	}
}

export class InvalidId<T extends string> extends ConvexEffectError {
	// biome-ignore lint/style: workaround for typegen bug
	readonly _tag: "InvalidId" = "InvalidId"

	constructor(
		readonly table: T,
		readonly id: string,
	) {
		super(`Invalid id "${id}" for table "${table}".`)
	}
}

export class EffectDatabaseWriter<
	DataModel extends GenericDataModel,
> extends EffectDatabaseReader<DataModel> {
	protected override readonly db: GenericDatabaseWriter<DataModel>

	constructor(db: GenericDatabaseWriter<DataModel>) {
		super(db)
		this.db = db
	}

	insert<TableName extends TableNamesInDataModel<DataModel>>(
		table: TableName,
		value: WithoutSystemFields<DocumentByName<DataModel, TableName>>,
	): Effect.Effect<GenericId<TableName>, never, never> {
		return Effect.promise(() => this.db.insert(table, value))
	}

	patch<TableName extends TableNamesInDataModel<DataModel>>(
		id: GenericId<TableName>,
		value: Partial<DocumentByName<DataModel, TableName>>,
	): Effect.Effect<void, never, never> {
		return Effect.promise(() => this.db.patch(id, value))
	}

	replace<TableName extends TableNamesInDataModel<DataModel>>(
		id: GenericId<TableName>,
		value: WithOptionalSystemFields<DocumentByName<DataModel, TableName>>,
	): Effect.Effect<void, never, never> {
		return Effect.promise(() => this.db.replace(id, value))
	}

	delete(
		id: GenericId<TableNamesInDataModel<DataModel>>,
	): Effect.Effect<void, never, never> {
		return Effect.promise(() => this.db.delete(id))
	}
}
