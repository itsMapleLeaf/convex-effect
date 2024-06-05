import { v } from "convex/values"
import { Effect, pipe } from "effect"
import { db, effectMutation, effectQuery } from "./lib/convex-effect.ts"

export const create = effectMutation({
	args: {
		name: v.string(),
	},
	handler(ctx, args) {
		return Effect.gen(function* () {
			const key = crypto.randomUUID()
			yield* Effect.promise(() =>
				ctx.db.insert("users", { name: args.name, key }),
			)
			return key
		})
	},
})

export const getByKey = effectQuery({
	args: {
		key: v.string(),
	},
	handler(_, args) {
		return getUserByKey(args.key)
	},
})

export function getUserByKey(key: string) {
	return pipe(
		db.query("users"),
		Effect.map((query) => db.indexEquals(query, "key", key)),
		Effect.flatMap(db.first),
	)
}
