import type {
	ActionBuilder,
	DocumentByInfo,
	GenericActionCtx,
	GenericDataModel,
	GenericMutationCtx,
	GenericQueryCtx,
	GenericTableInfo,
	IndexNames,
	IndexRange,
	MutationBuilder,
	NamedIndex,
	OrderedQuery,
	QueryBuilder,
	QueryInitializer,
} from "convex/server"
import type { GenericId, ObjectType, PropertyValidators } from "convex/values"
import { Effect, pipe } from "effect"
import { DocNotFoundError } from "./db.ts"
import {
	ActionCtxService,
	MutationCtxService,
	QueryCtxService,
} from "./services.ts"

export type FunctionBuilderOptions<
	Ctx,
	Service,
	Args extends PropertyValidators,
	Result,
> = {
	args: Args
	handler: (
		ctx: Ctx,
		args: ObjectType<Args>,
	) => Effect.Effect<Result, unknown, Service>
}

export function configure<DataModel extends GenericDataModel>({
	query: createQuery,
	mutation: createMutation,
	action: createAction,
}: {
	query: QueryBuilder<DataModel, "public">
	mutation: MutationBuilder<DataModel, "public">
	action: ActionBuilder<DataModel, "public">
}) {
	function getQueryCtx() {
		return Effect.map(
			QueryCtxService,
			(init) => init() as GenericQueryCtx<DataModel>,
		)
	}

	function getMutationCtx() {
		return Effect.map(
			MutationCtxService,
			(init) => init() as GenericMutationCtx<DataModel>,
		)
	}

	function getActionCtx() {
		return Effect.map(
			ActionCtxService,
			(init) => init() as GenericActionCtx<DataModel>,
		)
	}

	const db = {
		get<TableName extends string>(id: GenericId<TableName>) {
			return pipe(
				getQueryCtx(),
				Effect.flatMap((ctx) => Effect.promise(() => ctx.db.get(id))),
				Effect.flatMap(Effect.fromNullable),
				Effect.mapError(() => new DocNotFoundError(undefined, id)),
			)
		},

		indexEquals<
			TableInfo extends GenericTableInfo,
			IndexName extends IndexNames<TableInfo>,
		>(
			query: QueryInitializer<TableInfo>,
			index: IndexName,
			...values: IndexValues<TableInfo, IndexName>
		) {
			return query.withIndex(
				index,
				(q) =>
					values.reduce((q, value) => q.eq(value), q) as unknown as IndexRange,
			)
		},

		query<TableName extends string>(table: TableName) {
			return pipe(
				getQueryCtx(),
				Effect.map((ctx) => ctx.db.query(table)),
			)
		},

		first<TableInfo extends GenericTableInfo>(query: OrderedQuery<TableInfo>) {
			return pipe(
				Effect.promise(() => query.first()),
				Effect.flatMap(Effect.fromNullable),
				Effect.mapError(() => new DocNotFoundError()),
			)
		},
	}

	function effectQuery<Args extends PropertyValidators, Result>(
		options: FunctionBuilderOptions<
			GenericQueryCtx<DataModel>,
			QueryCtxService,
			Args,
			Result
		>,
	) {
		return createQuery({
			args: options.args,
			handler(ctx, args) {
				return pipe(
					options.handler(ctx, args),
					Effect.provideService(QueryCtxService, () => ctx),
					Effect.runPromise,
				)
			},
		})
	}

	function effectMutation<Args extends PropertyValidators, Result>(
		options: FunctionBuilderOptions<
			GenericMutationCtx<DataModel>,
			MutationCtxService | QueryCtxService,
			Args,
			Result
		>,
	) {
		return createMutation({
			args: options.args,
			handler(ctx, args) {
				return pipe(
					options.handler(ctx, args),
					Effect.provideService(QueryCtxService, () => ctx),
					Effect.provideService(MutationCtxService, () => ctx),
					Effect.runPromise,
				)
			},
		})
	}

	function effectAction<Args extends PropertyValidators, Result>(
		options: FunctionBuilderOptions<
			GenericActionCtx<DataModel>,
			ActionCtxService,
			Args,
			Result
		>,
	) {
		return createAction({
			args: options.args,
			handler(ctx, args) {
				return pipe(
					options.handler(ctx, args),
					Effect.provideService(ActionCtxService, () => ctx),
					Effect.runPromise,
				)
			},
		})
	}

	return {
		db,
		getQueryCtx,
		getMutationCtx,
		getActionCtx,
		effectQuery,
		effectMutation,
		effectAction,
	}
}

type IndexValues<
	TableInfo extends GenericTableInfo,
	IndexName extends IndexNames<TableInfo>,
> = _IndexValues<
	DropLast<NamedIndex<TableInfo, IndexName>>,
	DocumentByInfo<TableInfo>
>

type _IndexValues<IndexKeys extends readonly unknown[], DocType> = {
	[n in keyof IndexKeys]: IndexKeys[n] extends keyof DocType
		? DocType[IndexKeys[n]]
		: never
}

type DropLast<T extends readonly unknown[]> = T extends readonly [
	...infer U,
	unknown,
]
	? U
	: never
