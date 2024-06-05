import { Validator, type Infer, type PropertyValidators } from "convex/values"
import type { NonEmptyArray } from "./types.ts"

export type EffectIndexEntry = {
	key: string
	validator: IndexValidator
}

type IndexValidator = Validator<string | number | undefined, boolean, string>

export type IndexValues<
	Entries extends Readonly<NonEmptyArray<EffectIndexEntry>>,
> = {
	[i in keyof Entries]: Infer<Entries[i]["validator"]>
}

export function pickIndexProperties<Properties extends PropertyValidators>(
	properties: Properties,
): PickIndexProperties<Properties> {
	const result: Record<string, Readonly<NonEmptyArray<EffectIndexEntry>>> = {}
	for (const [key, validator] of Object.entries(properties)) {
		const indexProperty = EffectIndexProperty.fromSymbol(validator)
		if (indexProperty) {
			result[key] = [{ key, validator }]
		}
	}
	return result as PickIndexProperties<Properties>
}

type PickIndexProperties<Properties extends PropertyValidators> = {
	readonly [K in keyof Properties as Properties[K] extends IndexValidator
		? K
		: never]: readonly [{ key: K; validator: Properties[K] }]
}

export function defineIndex<ValidatorType extends IndexValidator>(
	validator: ValidatorType,
) {
	return Object.assign(validator, {
		[EffectIndexProperty.symbol]: new EffectIndexProperty(),
	})
}

class EffectIndexProperty {
	static readonly symbol = Symbol(this.name)

	static fromSymbol(object: object): EffectIndexProperty | undefined {
		if (EffectIndexProperty.symbol in object) {
			const value = object[EffectIndexProperty.symbol]
			if (value instanceof EffectIndexProperty) {
				return value
			}
		}
	}
}
