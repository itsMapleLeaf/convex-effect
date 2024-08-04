import type { Auth, UserIdentity } from "convex/server"
import { Effect } from "effect"
import { YieldableError } from "effect/Cause"
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

export class NotLoggedIn extends YieldableError {
	readonly _tag = "NotLoggedIn"
}
