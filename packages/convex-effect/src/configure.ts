import type {
	ActionBuilder,
	GenericActionCtx,
	GenericDataModel,
	GenericMutationCtx,
	GenericQueryCtx,
	MutationBuilder,
	QueryBuilder,
} from "convex/server"
import type { ObjectType, PropertyValidators } from "convex/values"
import { Context, Effect, pipe } from "effect"

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
	query,
	mutation,
	action,
}: {
	query: QueryBuilder<DataModel, "public">
	mutation: MutationBuilder<DataModel, "public">
	action: ActionBuilder<DataModel, "public">
}) {
	class QueryCtxService extends Context.Tag("convex-effect:QueryCtxService")<
		QueryCtxService,
		GenericQueryCtx<DataModel>
	>() {}

	class MutationCtxService extends Context.Tag(
		"convex-effect:MutationCtxService",
	)<MutationCtxService, GenericMutationCtx<DataModel>>() {}

	class ActionCtxService extends Context.Tag("convex-effect:ActionCtxService")<
		ActionCtxService,
		GenericActionCtx<DataModel>
	>() {}

	function effectQuery<Args extends PropertyValidators, Result>(
		options: FunctionBuilderOptions<
			GenericQueryCtx<DataModel>,
			QueryCtxService,
			Args,
			Result
		>,
	) {
		return query({
			args: options.args,
			handler(ctx, args) {
				return pipe(
					options.handler(ctx, args),
					Effect.provideService(QueryCtxService, ctx),
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
		return mutation({
			args: options.args,
			handler(ctx, args) {
				return pipe(
					options.handler(ctx, args),
					Effect.provideService(QueryCtxService, ctx),
					Effect.provideService(MutationCtxService, ctx),
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
		return action({
			args: options.args,
			handler(ctx, args) {
				return pipe(
					options.handler(ctx, args),
					Effect.provideService(ActionCtxService, ctx),
					Effect.runPromise,
				)
			},
		})
	}

	return {
		effectQuery,
		effectMutation,
		effectAction,
	}
}
