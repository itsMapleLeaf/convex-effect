import { expect, test } from "bun:test"
import { startBackend } from "../lib/convex-backend.js"
import { api } from "./_generated/api.js"

test("crud", async () => {
	await using backend = await startBackend()

	expect(await backend.client.query(api.todos.list, {})).toEqual([])

	const inputs = [{ text: "jupiter" }, { text: "saturn" }, { text: "mars" }]
	const docs = []
	for (const item of inputs) {
		const id = await backend.client.mutation(api.todos.create, item)
		docs.push({ ...item, _id: id, completed: false })
	}

	expect(await backend.client.query(api.todos.list, {})).toEqual(
		docs.map((item) => expect.objectContaining(item)),
	)

	expect(await backend.client.query(api.todos.getFirst, {})).toEqual(
		expect.objectContaining(docs[0]),
	)

	for (const item of docs) {
		expect(await backend.client.query(api.todos.get, { id: item._id })).toEqual(
			expect.objectContaining(item),
		)
	}

	await backend.client.mutation(api.todos.update, {
		id: docs[0]._id,
		completed: true,
	})
	await backend.client.mutation(api.todos.remove, { id: docs[1]._id })

	expect(await backend.client.query(api.todos.list, {})).toEqual([
		expect.objectContaining({ ...docs[0], completed: true }),
		expect.objectContaining(docs[2]),
	])

	expect(await backend.client.query(api.todos.getFirst, {})).toEqual(
		expect.objectContaining({ ...docs[0], completed: true }),
	)
	expect(await backend.client.query(api.todos.getLatest, {})).toEqual(
		expect.objectContaining(docs[2]),
	)
})
