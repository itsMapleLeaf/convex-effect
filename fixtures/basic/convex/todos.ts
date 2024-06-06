import {
	deleteFrom,
	effectMutation,
	effectQuery,
	fromTable,
	insertInto,
	patchIn,
} from "convex-effect"
import { v } from "convex/values"
import { todos } from "./tables.ts"

export const create = effectMutation({
	args: {
		text: v.string(),
	},
	handler(args) {
		return insertInto(todos, { text: args.text, completed: false })
	},
})

export const list = effectQuery({
	args: {},
	handler: () => fromTable(todos),
})

export const get = effectQuery({
	args: {
		id: v.id("todos"),
	},
	handler: (args) => fromTable(todos).get(args.id).orNull(),
})

export const getFirst = effectQuery({
	args: {},
	handler: () => fromTable(todos).first().orNull(),
})

export const getLatest = effectQuery({
	args: {},
	handler: () => fromTable(todos).order("desc").first().orNull(),
})

export const update = effectMutation({
	args: {
		id: v.id("todos"),
		completed: v.boolean(),
	},
	handler(args) {
		return patchIn(todos, args.id, { completed: args.completed })
	},
})

export const remove = effectMutation({
	args: {
		id: v.id("todos"),
	},
	handler(args) {
		return deleteFrom(todos, args.id)
	},
})
