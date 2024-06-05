import {
	actionGeneric,
	mutationGeneric,
	queryGeneric,
	type GenericActionCtx,
	type GenericDataModel,
	type GenericMutationCtx,
	type GenericQueryCtx,
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
		args: ObjectType<Args>,
		ctx: Ctx,
	) => Effect.Effect<Result, never, Service>
}

export function effectQuery<Args extends PropertyValidators, Result>(
	options: FunctionBuilderOptions<
		GenericQueryCtx<GenericDataModel>,
		QueryCtxService,
		Args,
		Result
	>,
) {
	return queryGeneric({
		args: options.args,
		handler(ctx, args) {
			return pipe(
				options.handler(args, ctx),
				Effect.provideService(QueryCtxService, ctx as any),
				Effect.runPromise,
			)
		},
	})
}

export function effectMutation<Args extends PropertyValidators, Result>(
	options: FunctionBuilderOptions<
		GenericMutationCtx<GenericDataModel>,
		MutationCtxService | QueryCtxService,
		Args,
		Result
	>,
) {
	return mutationGeneric({
		args: options.args,
		handler(ctx, args) {
			return pipe(
				options.handler(args, ctx),
				Effect.provideService(QueryCtxService, ctx as any),
				Effect.provideService(MutationCtxService, ctx as any),
				Effect.runPromise,
			)
		},
	})
}

export function effectAction<Args extends PropertyValidators, Result>(
	options: FunctionBuilderOptions<
		GenericActionCtx<GenericDataModel>,
		ActionCtxService,
		Args,
		Result
	>,
) {
	return actionGeneric({
		args: options.args,
		handler(ctx, args) {
			return pipe(
				options.handler(args, ctx),
				Effect.provideService(ActionCtxService, ctx as any),
				Effect.runPromise,
			)
		},
	})
}
