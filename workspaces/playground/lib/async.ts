import { Iterator } from "iterator-helpers-polyfill"

export function asyncMap<In, Out>(
	inputs: Iterable<In>,
	fn: (value: In) => Out,
) {
	return Promise.all(Iterator.from(inputs).map(fn))
}
