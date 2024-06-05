import { effectMutation, effectQuery, queryFrom } from "convex-effect"
import { v } from "convex/values"
import { Console, Effect, pipe } from "effect"
import { users } from "../tables.ts"

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
		return pipe(
			queryFrom(users).byIndex("key", args.key).first(),
			Effect.tapError(Console.warn),
			Effect.orElseSucceed(() => null),
		)
	},
})
