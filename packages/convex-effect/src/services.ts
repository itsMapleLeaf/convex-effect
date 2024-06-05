import type {
	GenericActionCtx,
	GenericDataModel,
	GenericMutationCtx,
	GenericQueryCtx,
} from "convex/server"
import { Context } from "effect"

export class QueryCtxService extends Context.Tag(
	"convex-effect:QueryCtxService",
)<QueryCtxService, GenericQueryCtx<GenericDataModel>>() {}

export class MutationCtxService extends Context.Tag(
	"convex-effect:MutationCtxService",
)<MutationCtxService, GenericMutationCtx<GenericDataModel>>() {}

export class ActionCtxService extends Context.Tag(
	"convex-effect:ActionCtxService",
)<ActionCtxService, GenericActionCtx<GenericDataModel>>() {}
