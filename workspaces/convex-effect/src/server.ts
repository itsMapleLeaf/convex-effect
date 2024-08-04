import {
	actionGeneric,
	httpActionGeneric,
	internalActionGeneric,
	internalMutationGeneric,
	internalQueryGeneric,
	mutationGeneric,
	queryGeneric,
	type ArgsArrayForOptionalValidator,
	type ArgsArrayToObject,
	type FunctionVisibility,
	type GenericDataModel,
	type PublicHttpAction,
	type RegisteredAction,
	type RegisteredMutation,
	type RegisteredQuery,
} from "convex/server"
import type { PropertyValidators } from "convex/values"
import { Effect, pipe } from "effect"
import {
	EffectActionCtx,
	EffectMutationCtx,
	EffectQueryCtx,
} from "./context.ts"

export type EffectQueryBuilder<
	DataModel extends GenericDataModel,
	Visibility extends FunctionVisibility,
> = <
	Args extends PropertyValidators | undefined,
	ArgsArray extends ArgsArrayForOptionalValidator<Args>,
	Return,
>(options: {
	args?: Args
	handler: (
		ctx: EffectQueryCtx<DataModel>,
		...args: ArgsArray
	) => Effect.Effect<Return, never, never>
}) => RegisteredQuery<Visibility, ArgsArrayToObject<ArgsArray>, Promise<Return>>

export type EffectMutationBuilder<
	DataModel extends GenericDataModel,
	Visibility extends FunctionVisibility,
> = <
	Args extends PropertyValidators | undefined,
	ArgsArray extends ArgsArrayForOptionalValidator<Args>,
	Return,
>(options: {
	args?: Args
	handler: (
		ctx: EffectMutationCtx<DataModel>,
		...args: ArgsArray
	) => Effect.Effect<Return, never, never>
}) => RegisteredMutation<
	Visibility,
	ArgsArrayToObject<ArgsArray>,
	Promise<Return>
>

export type EffectActionBuilder<
	DataModel extends GenericDataModel,
	Visibility extends FunctionVisibility,
> = <
	Args extends PropertyValidators | undefined,
	ArgsArray extends ArgsArrayForOptionalValidator<Args>,
	Return,
>(options: {
	args?: Args
	handler: (
		ctx: EffectActionCtx<DataModel>,
		...args: ArgsArray
	) => Effect.Effect<Return, never, never>
}) => RegisteredAction<
	Visibility,
	ArgsArrayToObject<ArgsArray>,
	Promise<Return>
>

export type EffectHttpActionBuilder = (
	handler: (
		ctx: EffectActionCtx<GenericDataModel>,
		request: Request,
	) => Effect.Effect<Response, never, never>,
) => PublicHttpAction

export interface ServerApi<DataModel extends GenericDataModel> {
	query: EffectQueryBuilder<DataModel, "public">
	internalQuery: EffectQueryBuilder<DataModel, "internal">
	mutation: EffectMutationBuilder<DataModel, "public">
	internalMutation: EffectMutationBuilder<DataModel, "internal">
	action: EffectActionBuilder<DataModel, "public">
	internalAction: EffectActionBuilder<DataModel, "internal">
	httpAction: EffectHttpActionBuilder
}

export function createServerApi<
	DataModel extends GenericDataModel,
>(): ServerApi<DataModel> {
	return {
		query: (options) => {
			return queryGeneric({
				args: options.args,
				handler(ctx, ...args) {
					return pipe(
						options.handler(new EffectQueryCtx(ctx), ...args),
						Effect.runPromise,
					)
				},
			})
		},
		internalQuery: (options) => {
			return internalQueryGeneric({
				args: options.args,
				handler(ctx, ...args) {
					return pipe(
						options.handler(new EffectQueryCtx(ctx), ...args),
						Effect.runPromise,
					)
				},
			})
		},
		mutation: (options) => {
			return mutationGeneric({
				args: options.args,
				handler(ctx, ...args) {
					return pipe(
						options.handler(new EffectMutationCtx(ctx), ...args),
						Effect.runPromise,
					)
				},
			})
		},
		internalMutation: (options) => {
			return internalMutationGeneric({
				args: options.args,
				handler(ctx, ...args) {
					return pipe(
						options.handler(new EffectMutationCtx(ctx), ...args),
						Effect.runPromise,
					)
				},
			})
		},
		action: (options) => {
			return actionGeneric({
				args: options.args,
				handler(ctx, ...args) {
					return pipe(
						options.handler(new EffectActionCtx(ctx), ...args),
						Effect.runPromise,
					)
				},
			})
		},
		internalAction: (options) => {
			return internalActionGeneric({
				args: options.args,
				handler(ctx, ...args) {
					return pipe(
						options.handler(new EffectActionCtx(ctx), ...args),
						Effect.runPromise,
					)
				},
			})
		},
		httpAction: (handler) => {
			return httpActionGeneric((ctx, request) => {
				return pipe(
					handler(new EffectActionCtx(ctx), request),
					Effect.runPromise,
				)
			})
		},
	}
}
