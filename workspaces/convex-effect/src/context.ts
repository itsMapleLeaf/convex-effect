import type {
	GenericActionCtx,
	GenericDataModel,
	GenericMutationCtx,
	GenericQueryCtx,
} from "convex/server"
import { EffectDatabaseReader } from "./db.ts"

export class EffectQueryCtx<DataModel extends GenericDataModel> {
	readonly db: EffectDatabaseReader<DataModel>

	constructor(ctx: GenericQueryCtx<DataModel>) {
		this.db = new EffectDatabaseReader(ctx.db)
	}
}

export class EffectMutationCtx<
	DataModel extends GenericDataModel,
> extends EffectQueryCtx<DataModel> {
	readonly db: EffectDatabaseReader<DataModel>

	constructor(ctx: GenericMutationCtx<DataModel>) {
		super(ctx)
		this.db = new EffectDatabaseReader(ctx.db)
	}
}

export class EffectActionCtx<DataModel extends GenericDataModel> {
	constructor(private readonly ctx: GenericActionCtx<DataModel>) {}
}
