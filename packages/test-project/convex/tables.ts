import { defineIndex, defineTable } from "convex-effect"
import { v } from "convex/values"

export const users = defineTable("users", {
	name: v.string(),
	key: defineIndex(v.string()), // very secure authentication method! user just needs to pass a generated key to identify themselves
})

export const rooms = defineTable("rooms", {
	name: v.string(),
})

export const roomUsers = defineTable("roomUsers", {
	roomId: v.id("rooms"),
	userId: v.id("users"),
})

export const messages = defineTable("messages", {
	roomId: v.id("rooms"),
	userId: v.id("users"),
	text: v.string(),
})
