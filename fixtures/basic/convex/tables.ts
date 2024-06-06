import { v } from "convex/values"
import { defineIndex, defineTable } from "../../../src/index.ts"

export const users = defineTable("users", {
	name: v.string(),
	key: defineIndex(v.string()), // very secure authentication method! user just needs to pass a generated key to identify themselves
})

export const rooms = defineTable("rooms", {
	name: v.string(),
	visilbility: defineIndex(v.union(v.literal("public"), v.literal("private"))),
})

export const roomUsers = defineTable("roomUsers", {
	roomId: defineIndex(v.id("rooms")),
	userId: defineIndex(v.id("users")),
})

export const messages = defineTable("messages", {
	roomId: defineIndex(v.id("rooms")),
	userId: defineIndex(v.id("users")),
	text: v.string(),
})
