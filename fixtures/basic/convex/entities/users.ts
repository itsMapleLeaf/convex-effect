import { v } from "convex/values"
import { Effect, pipe } from "effect"
import { Iterator } from "iterator-helpers-polyfill"
import {
	effectMutation,
	effectQuery,
	getFrom,
	insertInto,
	queryFrom,
} from "../../../../src/index.ts"
import { roomUsers, users } from "../tables.ts"

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

export const listByRoom = effectQuery({
	args: {
		roomId: v.id("rooms"),
	},
	handler(args) {
		return Effect.gen(function* () {
			const roomUserDocs = yield* queryFrom(roomUsers)
				.byIndex("roomId", args.roomId)
				.collect()

			return yield* Effect.allSuccesses(
				Iterator.from(roomUserDocs).map((roomUser) =>
					getFrom(users, roomUser.userId),
				),
				{ concurrency: "unbounded" },
			)
		})
	},
})
