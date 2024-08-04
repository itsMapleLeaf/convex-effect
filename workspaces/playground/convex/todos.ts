import { v } from "convex/values"
import { Effect } from "effect"
import { mutation, query } from "../lib/api.ts"

export const get = query({
	args: {
		id: v.id("todos"),
	},
	handler(ctx, args) {
		return ctx.db.get(args.id).pipe(Effect.orDie)
	},
})

export const getFirst = query({
	args: {},
	handler(ctx) {
		throw new Error("not implemented")
	},
})

export const getLatest = query({
	args: {},
	handler(ctx) {
		throw new Error("not implemented")
	},
})

export const list = query({
	args: {},
	handler(ctx) {
		throw new Error("not implemented")
	},
})

export const create = mutation({
	args: {
		text: v.string(),
	},
	handler(ctx, args) {
		throw new Error("not implemented")
	},
})

export const update = mutation({
	args: {
		id: v.id("todos"),
		completed: v.boolean(),
	},
	handler(ctx, args) {
		throw new Error("not implemented")
	},
})

export const remove = mutation({
	args: {
		id: v.id("todos"),
	},
	handler(ctx, args) {
		throw new Error("not implemented")
	},
})
