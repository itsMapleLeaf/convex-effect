import {
	type ArgsArrayForOptionalValidator,
	type ArgsArrayToObject,
	type FunctionVisibility,
	type GenericDataModel,
	type PublicHttpAction,
	type RegisteredAction,
	type RegisteredMutation,
	type RegisteredQuery,
	actionGeneric,
	httpActionGeneric,
	internalActionGeneric,
	internalMutationGeneric,
	internalQueryGeneric,
	mutationGeneric,
	queryGeneric,
} from "convex/server"
import { ConvexError, type PropertyValidators } from "convex/values"
import { Cause, Effect, Exit } from "effect"
import {
	EffectActionCtx,
	EffectMutationCtx,
	EffectQueryCtx,
} from "./context.ts"
import { ConvexEffectError } from "./errors.ts"

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
					return runConvexEffect(
						options.handler(new EffectQueryCtx(ctx), ...args),
					)
				},
			})
		},
		internalQuery: (options) => {
			return internalQueryGeneric({
				args: options.args,
				handler(ctx, ...args) {
					return runConvexEffect(
						options.handler(new EffectQueryCtx(ctx), ...args),
					)
				},
			})
		},
		mutation: (options) => {
			return mutationGeneric({
				args: options.args,
				handler(ctx, ...args) {
					return runConvexEffect(
						options.handler(new EffectMutationCtx(ctx), ...args),
					)
				},
			})
		},
		internalMutation: (options) => {
			return internalMutationGeneric({
				args: options.args,
				handler(ctx, ...args) {
					return runConvexEffect(
						options.handler(new EffectMutationCtx(ctx), ...args),
					)
				},
			})
		},
		action: (options) => {
			return actionGeneric({
				args: options.args,
				handler(ctx, ...args) {
					return runConvexEffect(
						options.handler(new EffectActionCtx(ctx), ...args),
					)
				},
			})
		},
		internalAction: (options) => {
			return internalActionGeneric({
				args: options.args,
				handler(ctx, ...args) {
					return runConvexEffect(
						options.handler(new EffectActionCtx(ctx), ...args),
					)
				},
			})
		},
		httpAction: (handler) => {
			return httpActionGeneric((ctx, request) => {
				return runConvexEffect(handler(new EffectActionCtx(ctx), request))
			})
		},
	}
}

export async function runConvexEffect<T>(
	effect: Effect.Effect<T, unknown, never>,
): Promise<T> {
	const exit = await Effect.runPromiseExit(effect)

	if (Exit.isSuccess(exit)) {
		return exit.value
	}

	if (Cause.isFailType(exit.cause)) {
		if (exit.cause.error instanceof ConvexEffectError) {
			throw new ConvexError(exit.cause.error.message)
		}
		throw exit.cause.error
	}

	if (Cause.isDieType(exit.cause)) {
		if (exit.cause.defect instanceof ConvexEffectError) {
			throw new ConvexError(exit.cause.defect.message)
		}
		throw exit.cause.defect
	}

	console.error(
		"[convex-effect] Encountered unknown error cause type:",
		exit.cause[Cause.CauseTypeId],
	)
	console.error(
		"[convex-effect] You should catch this cause type yourself if you want a better error message.",
	)
	throw exit.cause
}
