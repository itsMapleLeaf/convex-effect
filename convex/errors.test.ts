import { expect, test } from "bun:test"
import { ConvexError } from "convex/values"
import { startBackend } from "../lib/convex-backend.ts"
import { api } from "./_generated/api.js"

test("ConvexEffectError is thrown as ConvexError", async () => {
	await using backend = await startBackend()

	const error = await backend.client
		.mutation(api.errors.explode, {})
		.catch((error) => error)

	expect(error).toBeInstanceOf(ConvexError)
	expect(error.data).toBe("💣")
})
