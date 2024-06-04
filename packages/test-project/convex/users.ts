import type { QueryCtxService } from "convex-effect"
import { v } from "convex/values"
import { Effect, pipe } from "effect"
import type { Doc } from "./_generated/dataModel"
import {
	effectMutation,
	effectQuery,
	getQueryCtx,
} from "./lib/convex-effect.ts"

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

export function getUserByKey(
	key: string,
): Effect.Effect<Doc<"users"> | null, never, QueryCtxService> {
	return pipe(
		getQueryCtx(),
		Effect.flatMap((ctx) =>
			Effect.promise(() =>
				ctx.db
					.query("users")
					.withIndex("key", (q) => q.eq("key", key))
					.unique(),
			),
		),
	)
}
