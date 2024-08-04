import type {
	GenericActionCtx,
	GenericDataModel,
	GenericMutationCtx,
	GenericQueryCtx,
	SystemDataModel,
} from "convex/server"
import { EffectAuth } from "./auth.ts"
import { EffectDatabaseReader, EffectDatabaseWriter } from "./db.ts"
import { EffectStorageReader, EffectStorageWriter } from "./storage.ts"

export class EffectQueryCtx<DataModel extends GenericDataModel> {
	readonly db: EffectDatabaseReader<DataModel>
	readonly system: EffectDatabaseReader<SystemDataModel>
	readonly auth: EffectAuth
	readonly storage: EffectStorageReader

	constructor(ctx: GenericQueryCtx<DataModel>) {
		this.db = new EffectDatabaseReader(ctx.db)
		this.system = new EffectDatabaseReader(ctx.db.system)
		this.auth = new EffectAuth(ctx.auth)
		this.storage = new EffectStorageReader(ctx.storage)
	}
}

export class EffectMutationCtx<
	DataModel extends GenericDataModel,
> extends EffectQueryCtx<DataModel> {
	readonly db: EffectDatabaseWriter<DataModel>
	readonly storage: EffectStorageWriter

	constructor(ctx: GenericMutationCtx<DataModel>) {
		super(ctx)
		this.db = new EffectDatabaseWriter(ctx.db)
		this.storage = new EffectStorageWriter(ctx.storage)
	}
}

export class EffectActionCtx<DataModel extends GenericDataModel> {
	readonly auth: EffectAuth
	readonly storage: EffectStorageWriter

	constructor(ctx: GenericActionCtx<DataModel>) {
		this.auth = new EffectAuth(ctx.auth)
		this.storage = new EffectStorageWriter(ctx.storage)
	}
}
