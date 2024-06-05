import { defineTable as defineConvexTable } from "convex/server"
import {
	type GenericId,
	type Infer,
	type PropertyValidators,
} from "convex/values"
import { pickIndexProperties, type EffectIndexEntry } from "./indexes.ts"
import type { NonEmptyArray, Simplify } from "./types.ts"

export const TableConfig = Symbol("TableConfig")

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

export interface EffectTableConfig {
	name: string
	properties: PropertyValidators
	indexes: Record<string, Readonly<NonEmptyArray<EffectIndexEntry>>>
}

export function tableConfigFrom<Config extends EffectTableConfig>(
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
