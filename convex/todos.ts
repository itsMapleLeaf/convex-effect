import { v } from "convex/values"
import { mutation, query } from "./api.ts"

export const get = query({
	args: {
		id: v.id("todos"),
	},
	handler(ctx, args) {
		return ctx.db.getOrNull(args.id)
	},
})

export const getFirst = query({
	handler(ctx) {
		return ctx.db.query("todos").firstOrNull()
	},
})

export const getLatest = query({
	handler(ctx) {
		return ctx.db.query("todos").order("desc").firstOrNull()
	},
})

export const list = query({
	handler(ctx) {
		return ctx.db.query("todos").collect()
	},
})

export const create = mutation({
	args: {
		text: v.string(),
	},
	handler(ctx, args) {
		return ctx.db.insert("todos", { ...args, completed: false })
	},
})

export const update = mutation({
	args: {
		id: v.id("todos"),
		completed: v.boolean(),
	},
	handler(ctx, args) {
		return ctx.db.patch(args.id, { completed: args.completed })
	},
})

export const remove = mutation({
	args: {
		id: v.id("todos"),
	},
	handler(ctx, args) {
		return ctx.db.delete(args.id)
	},
})
