import type { GenericId } from "convex/values"
import { Effect } from "effect"
import { MutationCtxService } from "./services.ts"
import {
	tableConfigFrom,
	type EffectTableBaseDoc,
	type EffectTableConfig,
	type TableDefinitionWithConfig,
} from "./tables.ts"

export function insertInto<Config extends EffectTableConfig>(
	definition: TableDefinitionWithConfig<Config>,
	data: EffectTableBaseDoc<Config>,
) {
	const table = tableConfigFrom(definition)
	return Effect.gen(function* () {
		const ctx = yield* MutationCtxService
		return yield* Effect.promise(() => ctx.db.insert(table.name, data))
	})
}

export function patchIn<Config extends EffectTableConfig>(
	_definition: TableDefinitionWithConfig<Config>,
	id: GenericId<Config["name"]>,
	data: Partial<EffectTableBaseDoc<Config>>,
) {
	return Effect.gen(function* () {
		const ctx = yield* MutationCtxService
		return yield* Effect.promise(() => ctx.db.patch(id, data))
	})
}

export function deleteDoc<Config extends EffectTableConfig>(
	_definition: TableDefinitionWithConfig<Config>,
	id: GenericId<Config["name"]>,
) {
	return Effect.gen(function* () {
		const ctx = yield* MutationCtxService
		return yield* Effect.promise(() => ctx.db.delete(id))
	})
}
