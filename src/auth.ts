import type { Auth, UserIdentity } from "convex/server"
import { Effect } from "effect"
import { ConvexEffectError } from "./errors.ts"
import { isSomething } from "./helpers.ts"

export class EffectAuth {
	readonly #auth: Auth

	constructor(auth: Auth) {
		this.#auth = auth
	}

	getUserIdentityOrNull(): Effect.Effect<UserIdentity | null, never, never> {
		return Effect.promise(() => this.#auth.getUserIdentity())
	}

	getUserIdentity(): Effect.Effect<UserIdentity, NotLoggedIn, never> {
		return Effect.filterOrFail(
			this.getUserIdentityOrNull(),
			isSomething,
			() => new NotLoggedIn(),
		)
	}
}

export class NotLoggedIn extends ConvexEffectError {
	// biome-ignore lint/style: workaround for typegen bug
	readonly _tag: "NotLoggedIn" = "NotLoggedIn"

	constructor() {
		super("You must be logged in to perform this action.")
	}
}
