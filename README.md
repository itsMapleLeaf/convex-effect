# convex-effect

A simple, thin, [Effectful](https://effect.website) wrapper for [Convex](https://convex.dev).

## Install

```sh
# npm and friends
npx jsr add @maple/convex-effect

# deno
deno add @maple/convex-effect
```

See the [JSR docs](https://jsr.io/docs/using-packages#adding-a-package) for more details.

## Setup

First, configure your backend API:

```ts
// convex/api.ts
import { createServerApi } from "@maple/convex-effect"
import type { DataModel } from "./_generated/dataModel"

export const {
	query,
	internalQuery,
	mutation,
	internalMutation,
	action,
	internalAction,
	httpAction,
} = createServerApi<DataModel>()
```

Then use these functions instead of the generated ones:

```ts
// convex/todos.ts
import { v } from "convex/values"
import { mutation } from "./api.ts"

export const create = mutation({
	args: {
		text: v.string(),
	},
	handler(ctx, args) {
		return ctx.db.insert("todos", { ...args, completed: false })
	},
})
```

## Example

```ts
const createRoom = mutation({
	args: {
		name: v.string(),
	},
	// The `ctx` argument is a 1:1 mapping of Convex's [context](https://docs.convex.dev/functions/query-functions#query-context),
	// except each function returns an [`Effect`](https://effect.website/docs/guides/essentials)
	// instead of a `Promise`.
	handler(ctx, args) {
		return Effect.gen(function* () {
			// Functions that would normally return null in Convex raise an error instead.
			// This creates a clean happy path, where you can handle the error cases at the end,
			// or wherever else you like.
			const identity = yield* ctx.auth.getUserIdentity()

			const user = yield* ctx.db
				.query("users")
				.withIndex("tokenIdentifier", (q) =>
					q.eq("tokenIdentifier", identity.tokenIdentifier)
				)
				.first()

			const id = yield* ctx.db.insert("rooms", { name: args.name })
			yield* ctx.db.insert("roomMembers", { room: id, user: user._id })
		}).pipe(
			// If you don't handle error cases, you'll get a type error!
			Effect.catchAll({
				// This is an expected error, so we'll send an error message to the client.
				NotLoggedIn: (error) =>
					Effect.succeed("You must be logged in to create a room."),
				// This is unexpected, so we'll die, which throws an error in convex.
				DocNotFound: (error) =>
					Effect.dieMessage("Could not find user with token identifier."),
			}),
      // This will throw on any other unhandled errors, if there are any.
      Effect.orDie,
		),
	},
})

const getRoom = query({
	args: {
		id: v.id("rooms"),
	},
	handler(ctx, args) {
		// Nullable functions each have an `*OrNull` variant for when that's more convenient.
		return ctx.db.getOrNull(args.id)
	},
})
```
