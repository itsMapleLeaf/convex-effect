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
import { Effect, pipe } from "effect"
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
					Effect.provideService(QueryCtxService, ctx as any),
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
					Effect.provideService(QueryCtxService, ctx as any),
					Effect.provideService(MutationCtxService, ctx as any),
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
					Effect.provideService(ActionCtxService, ctx as any),
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
