import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export default defineSchema({
	users: defineTable({
		name: v.string(),
		key: v.string(), // very secure authentication method! user just needs to pass a generated key to identify themselves
	}).index("key", ["key"]),
	rooms: defineTable({
		name: v.string(),
	}),
	roomUsers: defineTable({
		roomId: v.id("rooms"),
		userId: v.id("users"),
	}),
	messages: defineTable({
		roomId: v.id("rooms"),
		userId: v.id("users"),
		text: v.string(),
	}),
})
