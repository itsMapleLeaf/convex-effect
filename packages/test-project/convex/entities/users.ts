import {
	effectMutation,
	effectQuery,
	getFrom,
	insertInto,
	queryFrom,
} from "convex-effect"
import { v } from "convex/values"
import { Effect, pipe } from "effect"
import { users } from "../tables.ts"

export const create = effectMutation({
	args: {
		name: v.string(),
	},
	handler(args) {
		return Effect.gen(function* () {
			const key = crypto.randomUUID()
			const id = yield* insertInto(users, { name: args.name, key })
			return { id, key }
		})
	},
})

export const get = effectQuery({
	args: {
		userId: v.id("users"),
	},
	handler(args) {
		return pipe(
			getFrom(users, args.userId),
			Effect.catchTag("DocNotFoundError", () => Effect.succeed(null)),
		)
	},
})

export const getByKey = effectQuery({
	args: {
		key: v.string(),
	},
	handler(args) {
		return pipe(
			queryFrom(users).byIndex("key", args.key).first(),
			Effect.catchTag("DocNotFoundError", () => Effect.succeed(null)),
		)
	},
})
