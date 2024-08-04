import type {
	GenericActionCtx,
	GenericDataModel,
	GenericMutationCtx,
	GenericQueryCtx,
	SystemDataModel,
} from "convex/server"
import { EffectDatabaseReader, EffectDatabaseWriter } from "./db.ts"

export class EffectQueryCtx<DataModel extends GenericDataModel> {
	readonly db: EffectDatabaseReader<DataModel>
	readonly system: EffectDatabaseReader<SystemDataModel>

	constructor(ctx: GenericQueryCtx<DataModel>) {
		this.db = new EffectDatabaseReader(ctx.db)
		this.system = new EffectDatabaseReader(ctx.db.system)
	}
}

export class EffectMutationCtx<
	DataModel extends GenericDataModel,
> extends EffectQueryCtx<DataModel> {
	readonly db: EffectDatabaseWriter<DataModel>

	constructor(ctx: GenericMutationCtx<DataModel>) {
		super(ctx)
		this.db = new EffectDatabaseWriter(ctx.db)
	}
}

export class EffectActionCtx<DataModel extends GenericDataModel> {
	constructor(private readonly ctx: GenericActionCtx<DataModel>) {}
}
