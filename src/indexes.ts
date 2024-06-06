import type { Infer, PropertyValidators, Validator } from "convex/values"
import type { NonEmptyArray } from "./types.ts"

export type IndexValidator = Validator<string | number | undefined, boolean, string>

export type EffectIndexEntry = {
	key: string
	validator: IndexValidator
}

export type IndexValues<Entries extends Readonly<NonEmptyArray<EffectIndexEntry>>> = {
	[i in keyof Entries]: Infer<Entries[i]["validator"]>
}

const EffectIndexPropertyTag = Symbol("EffectIndexProperty")

export function defineIndex<ValidatorType extends IndexValidator>(validator: ValidatorType) {
	return Object.assign(validator, {
		[EffectIndexPropertyTag]: EffectIndexPropertyTag,
	})
}

function isEffectIndexProperty(
	validator: Validator<unknown, boolean, string>,
): validator is IndexValidator {
	return (
		EffectIndexPropertyTag in validator &&
		validator[EffectIndexPropertyTag] === EffectIndexPropertyTag
	)
}

export function pickIndexProperties<Properties extends PropertyValidators>(
	properties: Properties,
): PickIndexProperties<Properties> {
	const result: Record<string, Readonly<NonEmptyArray<EffectIndexEntry>>> = {}
	for (const [key, validator] of Object.entries(properties)) {
		if (isEffectIndexProperty(validator)) {
			result[key] = [{ key, validator }]
		}
	}
	return result as PickIndexProperties<Properties>
}

type PickIndexProperties<Properties extends PropertyValidators> = {
	readonly [K in keyof Properties as Properties[K] extends IndexValidator ? K : never]: readonly [
		{ key: K; validator: Properties[K] },
	]
}
