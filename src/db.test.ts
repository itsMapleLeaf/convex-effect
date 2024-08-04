import { expect, mock, test } from "bun:test"
import type {
	GenericDataModel,
	GenericDatabaseReader,
	GenericDatabaseWriter,
} from "convex/server"
import type { GenericId } from "convex/values"
import { Effect } from "effect"
import {
	DocNotFound,
	EffectDatabaseReader,
	EffectDatabaseWriter,
	InvalidId,
} from "./db.ts"

// Mock data model and ID
type MockDataModel = GenericDataModel

const mockId: GenericId<"users"> = "123" as GenericId<"users">

test("EffectDatabaseReader.get returns the document if present", async () => {
	const reader = new EffectDatabaseReader({
		get: async () => ({
			_id: mockId,
			_creationTime: 0,
			name: "Alice",
			age: 30,
		}),
	} as unknown as GenericDatabaseReader<MockDataModel>)

	expect(Effect.runPromise(reader.get(mockId))).resolves.toEqual({
		_id: mockId,
		_creationTime: 0,
		name: "Alice",
		age: 30,
	})
})

test("EffectDatabaseReader.get fails with DocNotFound if not present", async () => {
	const reader = new EffectDatabaseReader({
		get: async () => null,
	} as unknown as GenericDatabaseReader<MockDataModel>)

	expect(
		reader.get(mockId).pipe(Effect.merge, Effect.runPromise),
	).resolves.toBeInstanceOf(DocNotFound)
})

test("EffectDatabaseReader.getOrNull returns the document if present", async () => {
	const reader = new EffectDatabaseReader({
		get: async () => ({
			_id: mockId,
			_creationTime: 0,
			name: "Alice",
			age: 30,
		}),
	} as unknown as GenericDatabaseReader<MockDataModel>)

	expect(Effect.runPromise(reader.getOrNull(mockId))).resolves.toEqual({
		_id: mockId,
		_creationTime: 0,
		name: "Alice",
		age: 30,
	})
})

test("EffectDatabaseReader.getOrNull returns null if not present", async () => {
	const reader = new EffectDatabaseReader({
		get: async () => null,
	} as unknown as GenericDatabaseReader<MockDataModel>)

	expect(Effect.runPromise(reader.getOrNull(mockId))).resolves.toBeNull()
})

test("EffectDatabaseReader.normalizeId returns the ID if valid", async () => {
	const reader = new EffectDatabaseReader({
		normalizeId: (table: string, id: string) => id as GenericId<typeof table>,
	} as unknown as GenericDatabaseReader<MockDataModel>)

	expect(Effect.runPromise(reader.normalizeId("users", "123"))).resolves.toBe(
		mockId,
	)
})

test("EffectDatabaseReader.normalizeId fails with InvalidId if not valid", async () => {
	const reader = new EffectDatabaseReader({
		normalizeId: () => null,
	} as unknown as GenericDatabaseReader<MockDataModel>)

	expect(
		reader
			.normalizeId("users", "invalid")
			.pipe(Effect.merge, Effect.runPromise),
	).resolves.toBeInstanceOf(InvalidId)
})

test("EffectDatabaseReader.normalizeIdOrNull returns the ID if valid", async () => {
	const reader = new EffectDatabaseReader({
		normalizeId: (table, id) => id as GenericId<typeof table>,
	} as GenericDatabaseReader<MockDataModel>)

	expect(
		Effect.runPromise(reader.normalizeIdOrNull("users", "123")),
	).resolves.toBe(mockId)
})

test("EffectDatabaseReader.normalizeIdOrNull returns null if not valid", async () => {
	const reader = new EffectDatabaseReader({
		normalizeId: () => null,
	} as unknown as GenericDatabaseReader<MockDataModel>)

	expect(
		Effect.runPromise(reader.normalizeIdOrNull("users", "invalid")),
	).resolves.toBeNull()
})

test("EffectDatabaseWriter.insert calls insert", async () => {
	const insert = mock(async () => mockId)
	const writer = new EffectDatabaseWriter({
		insert,
	} as unknown as GenericDatabaseWriter<MockDataModel>)

	expect(
		Effect.runPromise(writer.insert("users", { name: "Bob", age: 25 })),
	).resolves.toBe(mockId)
	expect(insert).toHaveBeenCalledWith("users", { name: "Bob", age: 25 })
})

test("EffectDatabaseWriter.patch calls patch", async () => {
	const patch = mock(async () => {})
	const writer = new EffectDatabaseWriter({
		patch,
	} as unknown as GenericDatabaseWriter<MockDataModel>)

	expect(
		Effect.runPromise(writer.patch(mockId, { age: 26 })),
	).resolves.toBeUndefined()
	expect(patch).toHaveBeenCalledWith(mockId, { age: 26 })
})

test("EffectDatabaseWriter.replace calls replace", async () => {
	const replace = mock(async () => {})
	const writer = new EffectDatabaseWriter({
		replace,
	} as unknown as GenericDatabaseWriter<MockDataModel>)

	expect(
		Effect.runPromise(writer.replace(mockId, { name: "Bob", age: 26 })),
	).resolves.toBeUndefined()
	expect(replace).toHaveBeenCalledWith(mockId, { name: "Bob", age: 26 })
})

test("EffectDatabaseWriter.delete calls delete", async () => {
	const delete_ = mock(async () => {})
	const writer = new EffectDatabaseWriter({
		delete: delete_,
	} as unknown as GenericDatabaseWriter<MockDataModel>)

	expect(Effect.runPromise(writer.delete(mockId))).resolves.toBeUndefined()
	expect(delete_).toHaveBeenCalledWith(mockId)
})
