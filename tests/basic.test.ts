import { expect, test } from "bun:test"
import { ConvexClient } from "convex/browser"
import { api } from "../fixtures/basic/convex/_generated/api.js"
import { asyncMap } from "../src/helpers.ts"

test("crud", async () => {
	const client = new ConvexClient("http://127.0.0.1:3210")

	expect(await client.query(api.todos.list, {})).toEqual([])

	const items = await asyncMap(
		[{ text: "jupiter" }, { text: "saturn" }, { text: "mars" }],
		async (item) => {
			const id = await client.mutation(api.todos.create, item)
			return { ...item, _id: id, completed: false }
		},
	)

	expect(await client.query(api.todos.list, {})).toEqual(
		items.map((item) => expect.objectContaining(item)),
	)

	expect(await client.query(api.todos.getFirst, {})).toEqual(
		expect.objectContaining(items[0]),
	)

	for (const item of items) {
		expect(await client.query(api.todos.get, { id: item._id })).toEqual(
			expect.objectContaining(item),
		)
	}

	await client.mutation(api.todos.update, { id: items[0]._id, completed: true })
	await client.mutation(api.todos.remove, { id: items[1]._id })

	expect(await client.query(api.todos.list, {})).toEqual([
		expect.objectContaining({ ...items[0], completed: true }),
		expect.objectContaining(items[2]),
	])

	expect(await client.query(api.todos.getFirst, {})).toEqual(
		expect.objectContaining({ ...items[0], completed: true }),
	)
})
