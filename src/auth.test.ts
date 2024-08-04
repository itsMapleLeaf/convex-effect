import { expect, test } from "bun:test"
import { Effect } from "effect"
import { EffectAuth, NotLoggedIn } from "./auth.ts"

test("getUserIdentity returns the user if present", async () => {
	const auth = new EffectAuth({
		getUserIdentity: async () => ({
			issuer: "",
			subject: "",
			tokenIdentifier: "",
		}),
	})
	expect(Effect.runPromise(auth.getUserIdentity())).resolves.not.toBeNull()
})

test("getUserIdentity fails with NotLoggedIn if not present", async () => {
	const auth = new EffectAuth({
		getUserIdentity: async () => null,
	})
	expect(
		auth.getUserIdentity().pipe(Effect.merge, Effect.runPromise),
	).resolves.toBeInstanceOf(NotLoggedIn)
})

test("getUserIdentityOrNull returns the user if present", async () => {
	const auth = new EffectAuth({
		getUserIdentity: async () => ({
			issuer: "",
			subject: "",
			tokenIdentifier: "",
		}),
	})
	expect(
		Effect.runPromise(auth.getUserIdentityOrNull()),
	).resolves.not.toBeNull()
})

test("getUserIdentityOrNull returns null if not present", async () => {
	const auth = new EffectAuth({
		getUserIdentity: async () => null,
	})
	expect(Effect.runPromise(auth.getUserIdentityOrNull())).resolves.toBeNull()
})
