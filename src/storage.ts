import type { StorageReader, StorageWriter } from "convex/server"
import type { GenericId } from "convex/values"
import { Data, Effect } from "effect"
import { isSomething } from "./helpers.ts"

export class EffectStorageReader {
	protected readonly storage: StorageReader

	constructor(storage: StorageReader) {
		this.storage = storage
	}

	getUrlOrNull(
		storageId: GenericId<"_storage">,
	): Effect.Effect<string | null, never, never> {
		return Effect.promise(() => this.storage.getUrl(storageId))
	}

	getUrl(
		storageId: GenericId<"_storage">,
	): Effect.Effect<string, FileNotFound, never> {
		return Effect.filterOrFail(
			this.getUrlOrNull(storageId),
			isSomething,
			() => new FileNotFound({ storageId }),
		)
	}
}

export class EffectStorageWriter extends EffectStorageReader {
	protected readonly storage: StorageWriter

	constructor(storage: StorageWriter) {
		super(storage)
		this.storage = storage
	}

	generateUploadUrl(): Effect.Effect<string, never, never> {
		return Effect.promise(() => this.storage.generateUploadUrl())
	}

	delete(storageId: GenericId<"_storage">): Effect.Effect<void, never, never> {
		return Effect.promise(() => this.storage.delete(storageId))
	}
}

export class FileNotFound extends Data.Error<{
	storageId: GenericId<"_storage">
}> {
	readonly _tag = "FileNotFound"
}
