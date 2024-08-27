import type {
	DocumentByName,
	FunctionReference,
	FunctionReturnType,
	FunctionVisibility,
	GenericActionCtx,
	GenericDataModel,
	GenericMutationCtx,
	GenericQueryCtx,
	NamedTableInfo,
	OptionalRestArgs,
	SystemDataModel,
	TableNamesInDataModel,
	VectorIndexNames,
	VectorSearchQuery,
} from "convex/server"
import { Effect } from "effect"
import type { Simplify } from "type-fest"
import { EffectAuth } from "./auth.ts"
import { EffectDatabaseReader, EffectDatabaseWriter } from "./db.ts"
import { EffectScheduler } from "./scheduler.ts"
import { EffectStorageReader, EffectStorageWriter } from "./storage.ts"

export class EffectQueryCtx<DataModel extends GenericDataModel> {
	readonly internal: GenericQueryCtx<DataModel>
	readonly db: EffectDatabaseReader<DataModel>
	readonly system: EffectDatabaseReader<SystemDataModel>
	readonly auth: EffectAuth
	readonly storage: EffectStorageReader

	constructor(ctx: GenericQueryCtx<DataModel>) {
		this.internal = ctx
		this.db = new EffectDatabaseReader(ctx.db)
		this.system = new EffectDatabaseReader(ctx.db.system)
		this.auth = new EffectAuth(ctx.auth)
		this.storage = new EffectStorageReader(ctx.storage)
	}
}

export class EffectMutationCtx<
	DataModel extends GenericDataModel,
> extends EffectQueryCtx<DataModel> {
	override readonly internal: GenericMutationCtx<DataModel>
	override readonly db: EffectDatabaseWriter<DataModel>
	override readonly storage: EffectStorageWriter
	readonly scheduler: EffectScheduler

	constructor(ctx: GenericMutationCtx<DataModel>) {
		super(ctx)
		this.internal = ctx
		this.db = new EffectDatabaseWriter(ctx.db)
		this.storage = new EffectStorageWriter(ctx.storage)
		this.scheduler = new EffectScheduler(ctx.scheduler)
	}
}

export class EffectActionCtx<DataModel extends GenericDataModel> {
	readonly internal: GenericActionCtx<DataModel>
	readonly auth: EffectAuth
	readonly storage: EffectStorageWriter
	readonly scheduler: EffectScheduler

	constructor(ctx: GenericActionCtx<DataModel>) {
		this.internal = ctx
		this.auth = new EffectAuth(ctx.auth)
		this.storage = new EffectStorageWriter(ctx.storage)
		this.scheduler = new EffectScheduler(ctx.scheduler)
	}

	runQuery<Query extends FunctionReference<"query", FunctionVisibility>>(
		query: Query,
		...args: OptionalRestArgs<Query>
	): Effect.Effect<FunctionReturnType<Query>> {
		return Effect.promise(() => this.internal.runQuery(query, ...args))
	}

	runMutation<
		Mutation extends FunctionReference<"mutation", FunctionVisibility>,
	>(
		mutation: Mutation,
		...args: OptionalRestArgs<Mutation>
	): Effect.Effect<FunctionReturnType<Mutation>> {
		return Effect.promise(() => this.internal.runMutation(mutation, ...args))
	}

	runAction<Action extends FunctionReference<"action", FunctionVisibility>>(
		action: Action,
		...args: OptionalRestArgs<Action>
	): Effect.Effect<FunctionReturnType<Action>> {
		return Effect.promise(() => this.internal.runAction(action, ...args))
	}

	vectorSearch<
		TableName extends TableNamesInDataModel<DataModel>,
		IndexName extends VectorIndexNames<NamedTableInfo<DataModel, TableName>>,
	>(
		table: TableName,
		searchIndexName: IndexName,
		query: Simplify<
			VectorSearchQuery<NamedTableInfo<DataModel, TableName>, IndexName>
		>,
	): Effect.Effect<Array<DocumentByName<DataModel, TableName>>> {
		return Effect.promise(() =>
			this.internal.vectorSearch(table, searchIndexName, query),
		)
	}
}
