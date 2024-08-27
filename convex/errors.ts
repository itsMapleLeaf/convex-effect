import { Effect } from "effect"
import { ConvexEffectError } from "../src/errors.ts"
import { mutation } from "./api.ts"

export const explode = mutation({
	handler() {
		return Effect.die(new ConvexEffectError("💣"))
	},
})
