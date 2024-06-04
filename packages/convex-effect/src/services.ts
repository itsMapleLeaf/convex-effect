import { Context } from "effect"

export class QueryCtxService extends Context.Tag(
	"convex-effect:QueryCtxService",
)<QueryCtxService, () => unknown>() {}

export class MutationCtxService extends Context.Tag(
	"convex-effect:MutationCtxService",
)<MutationCtxService, () => unknown>() {}

export class ActionCtxService extends Context.Tag(
	"convex-effect:ActionCtxService",
)<ActionCtxService, () => unknown>() {}
