import { v } from "convex/values"
import { defineTable } from "../../../src/index.ts"

export const todos = defineTable("todos", {
	text: v.string(),
	completed: v.boolean(),
})
