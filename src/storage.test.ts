import { expect, mock, test } from "bun:test"
import type { StorageReader, StorageWriter } from "convex/server"
import type { GenericId } from "convex/values"
import { Effect } from "effect"
import {
	EffectStorageReader,
	EffectStorageWriter,
	FileNotFound,
} from "./storage.ts"

// Mock storage ID
const mockStorageId: GenericId<"_storage"> = "123" as GenericId<"_storage">

test("EffectStorageReader.getUrl returns the URL if present", async () => {
	const reader = new EffectStorageReader({
		getUrl: async () => "https://example.com/file.txt",
	} as unknown as StorageReader)
	expect(Effect.runPromise(reader.getUrl(mockStorageId))).resolves.toBe(
		"https://example.com/file.txt",
	)
})

test("EffectStorageReader.getUrl fails with FileNotFound if not present", async () => {
	const reader = new EffectStorageReader({
		getUrl: async () => null,
	} as unknown as StorageReader)
	expect(
		reader.getUrl(mockStorageId).pipe(Effect.merge, Effect.runPromise),
	).resolves.toBeInstanceOf(FileNotFound)
})

test("EffectStorageReader.getUrlOrNull returns the URL if present", async () => {
	const reader = new EffectStorageReader({
		getUrl: async () => "https://example.com/file.txt",
	} as unknown as StorageReader)
	expect(Effect.runPromise(reader.getUrlOrNull(mockStorageId))).resolves.toBe(
		"https://example.com/file.txt",
	)
})

test("EffectStorageReader.getUrlOrNull returns null if not present", async () => {
	const reader = new EffectStorageReader({
		getUrl: async () => null,
	} as unknown as StorageReader)
	expect(
		Effect.runPromise(reader.getUrlOrNull(mockStorageId)),
	).resolves.toBeNull()
})

test("EffectStorageWriter.generateUploadUrl returns a URL", async () => {
	const writer = new EffectStorageWriter({
		generateUploadUrl: async () => "https://example.com/upload",
	} as unknown as StorageWriter)
	expect(Effect.runPromise(writer.generateUploadUrl())).resolves.toBe(
		"https://example.com/upload",
	)
})

test("EffectStorageWriter.delete calls delete", async () => {
	const delete_ = mock(async () => {})
	const writer = new EffectStorageWriter({
		delete: delete_,
	} as unknown as StorageWriter)
	expect(
		Effect.runPromise(writer.delete(mockStorageId)),
	).resolves.toBeUndefined()
	expect(delete_).toHaveBeenCalledWith(mockStorageId)
})
