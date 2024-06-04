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
	query,
	mutation,
	action,
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
		return mutation({
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
		return action({
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
		getQueryCtx,
		getMutationCtx,
		getActionCtx,
		effectQuery,
		effectMutation,
		effectAction,
	}
}
