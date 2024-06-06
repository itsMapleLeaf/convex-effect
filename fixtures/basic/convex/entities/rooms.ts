import { v } from "convex/values"
import { Effect, pipe } from "effect"
import { Iterator } from "iterator-helpers-polyfill"
import { effectQuery, getFrom, queryFrom } from "../../../../src/index.ts"
import { rooms, roomUsers, users } from "../tables.ts"

export const listPublic = effectQuery({
	args: {},
	handler() {
		return queryFrom(rooms).byIndex("visilbility", "public").collect()
	},
})

export const listJoined = effectQuery({
	args: {
		userKey: v.string(),
	},
	handler(args) {
		return pipe(
			queryFrom(users).byIndex("key", args.userKey).first(),
			Effect.flatMap((user) =>
				queryFrom(roomUsers).byIndex("userId", user._id).collect(),
			),
			Effect.map((docs) =>
				Iterator.from(docs).map((roomUser) => getFrom(rooms, roomUser.roomId)),
			),
			Effect.flatMap((effects) =>
				Effect.allSuccesses(effects, { concurrency: "unbounded" }),
			),
			Effect.catchTag("DocNotFoundError", () => Effect.succeed([])),
		)
	},
})
