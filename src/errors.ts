import { Data } from "effect"

export class ConvexEffectError extends Data.Error<{ message: string }> {
	constructor(message: string) {
		super({ message })
	}
}
