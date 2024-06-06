import { v } from "convex/values"
import { Effect } from "effect"
import { effectMutation, effectQuery } from "../../../src/functions.ts"
import { deleteFrom, insertInto, patchIn } from "../../../src/mutations.ts"
import { getFrom, queryFrom } from "../../../src/queries.ts"
import { todos } from "./tables.ts"

export const create = effectMutation({
	args: {
		text: v.string(),
	},
	handler(args) {
		return insertInto(todos, { text: args.text, completed: false })
	},
})

export const get = effectQuery({
	args: {
		id: v.id("todos"),
	},
	handler(args) {
		return getFrom(todos, args.id).pipe(Effect.orElseSucceed(() => null))
	},
})

export const list = effectQuery({
	args: {},
	handler() {
		return queryFrom(todos).collect()
	},
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
