import type {
	OptionalRestArgs,
	SchedulableFunctionReference,
	Scheduler,
} from "convex/server"
import type { GenericId } from "convex/values"
import { Effect } from "effect"

export class EffectScheduler {
	protected readonly scheduler: Scheduler

	constructor(scheduler: Scheduler) {
		this.scheduler = scheduler
	}

	runAt<Ref extends SchedulableFunctionReference>(
		timestamp: number | Date,
		functionReference: SchedulableFunctionReference,
		...args: OptionalRestArgs<Ref>
	): Effect.Effect<GenericId<"_scheduled_functions">, never, never> {
		return Effect.promise(() =>
			this.scheduler.runAt(timestamp, functionReference, ...args),
		)
	}

	runAfter<Ref extends SchedulableFunctionReference>(
		delayMs: number,
		functionReference: SchedulableFunctionReference,
		...args: OptionalRestArgs<Ref>
	): Effect.Effect<GenericId<"_scheduled_functions">, never, never> {
		return Effect.promise(() =>
			this.scheduler.runAfter(delayMs, functionReference, ...args),
		)
	}

	cancel(
		id: GenericId<"_scheduled_functions">,
	): Effect.Effect<void, never, never> {
		return Effect.promise(() => this.scheduler.cancel(id))
	}
}
