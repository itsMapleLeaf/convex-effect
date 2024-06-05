import { Iterator } from "iterator-helpers-polyfill"

export function filterEntries<
	Key extends PropertyKey,
	Value,
	OutValue extends Value,
>(
	obj: Record<Key, Value>,
	predicate: (value: Value, key: Key) => value is OutValue,
): Record<Key, OutValue>
export function filterEntries<Key extends PropertyKey, Value>(
	obj: Record<Key, Value>,
	predicate: (value: Value, key: Key) => boolean,
): Record<Key, Value>
export function filterEntries(
	obj: object,
	predicate: (value: PropertyKey, key: unknown) => boolean,
) {
	return Object.fromEntries(
		Iterator.from(Object.entries(obj)).filter(([key, value]) =>
			predicate(value, key),
		),
	)
}
