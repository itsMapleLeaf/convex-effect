import {
	defineTable as defineConvexTable,
	type GenericTableInfo,
	type Query,
} from "convex/server"
import {
	Validator,
	type GenericId,
	type Infer,
	type PropertyValidators,
} from "convex/values"
import { Effect } from "effect"
import { QueryCtxService } from "./services.ts"
import type { NonEmptyArray, Simplify } from "./types.ts"

export function defineTable<
	Name extends EffectTableConfig["name"],
	Properties extends EffectTableConfig["properties"],
>(name: Name, properties: Properties) {
	const config = {
		name,
		properties,
		indexes: pickIndexProperties(properties),
	}

	const definitionWithIndexes = Object.keys(config.indexes).reduce(
		(table, key) => table.index(key, [key]),
		defineConvexTable(properties),
	)

	return Object.assign(definitionWithIndexes, {
		[TableConfig]: config,
	})
}

const TableConfig = Symbol("TableConfig")

export interface EffectTableConfig {
	name: string
	properties: PropertyValidators
	indexes: Record<string, Readonly<NonEmptyArray<EffectIndexEntry>>>
}

function tableConfigFrom<Config extends EffectTableConfig>(
	definition: Record<typeof TableConfig, Config>,
): Config {
	return definition[TableConfig]
}

export type EffectTableDoc<Config extends EffectTableConfig> = Simplify<
	{
		_id: GenericId<Config["name"]>
		_creationTime: number
	} & {
		[K in keyof Config["properties"]]: Infer<Config["properties"][K]>
	}
>

export function docFrom<Config extends EffectTableConfig>(
	definition: Record<typeof TableConfig, Config>,
	id: GenericId<Config["name"]>,
) {
	const config = tableConfigFrom(definition)
	return Effect.gen(function* () {
		const ctx = yield* QueryCtxService
		const doc = yield* Effect.promise(() => ctx.db.get(id))
		if (!doc) {
			return yield* Effect.fail(new DocNotFoundError(config.name, id))
		}
		return doc as EffectTableDoc<Config>
	})
}

export function queryFrom<Config extends EffectTableConfig>(
	definition: Record<typeof TableConfig, Config>,
) {
	const table = tableConfigFrom(definition)
	return new EffectQueryInitializer(table)
}

export class EffectQueryInitializer<Config extends EffectTableConfig> {
	constructor(readonly config: Config) {}

	byIndex<Name extends Extract<keyof Config["indexes"], string>>(
		index: Name,
		...values: IndexValues<Config["indexes"][Name]>
	) {
		return new EffectQuery(
			this.config,
			Effect.gen(this, function* () {
				const ctx = yield* QueryCtxService
				const query = ctx.db.query(this.config.name)
				const indexEntries = this.config.indexes[index]
				return query.withIndex(
					index,
					// @ts-expect-error: this API is impossible to make typesafe with generics
					(builder) =>
						indexEntries.reduce(
							// @ts-expect-error: this API is impossible to make typesafe with generics
							(builder, entry, i) => builder.eq(entry.key, values[i]),
							builder,
						),
				)
			}),
		)
	}
}

export class EffectQuery<Config extends EffectTableConfig> {
	constructor(
		private readonly config: Config,
		private readonly query: Effect.Effect<
			Query<GenericTableInfo>,
			never,
			QueryCtxService
		>,
	) {}

	first() {
		return Effect.gen(this, function* () {
			const query = yield* this.query
			const doc = yield* Effect.promise(() => query.first())
			if (!doc) {
				return yield* Effect.fail(new DocNotFoundError(this.config.name))
			}
			return doc as EffectTableDoc<Config>
		})
	}

	collect() {
		return Effect.gen(this, function* () {
			const query = yield* this.query
			const docs = yield* Effect.promise(() => query.collect())
			return docs as EffectTableDoc<Config>[]
		})
	}
}

export class DocNotFoundError<Table extends string> extends Error {
	readonly _tag = "DocNotFoundError"

	constructor(
		readonly table?: Table,
		readonly id?: GenericId<Table>,
	) {
		super(
			table && id
				? `couldn't find doc with id "${id}" in table "${table}"`
				: id
					? `couldn't find doc with id "${id}"`
					: table
						? `couldn't find doc in table "${table}"`
						: "couldn't find doc",
		)
	}
}

type EffectIndexEntry = {
	key: string
	validator: IndexValidator
}

type IndexValidator = Validator<string | number | undefined, boolean, string>

type IndexValues<Entries extends Readonly<NonEmptyArray<EffectIndexEntry>>> = {
	[i in keyof Entries]: Infer<Entries[i]["validator"]>
}

function pickIndexProperties<Properties extends PropertyValidators>(
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
