export function isSomething<T>(value: T): value is NonNullable<T> {
	return value != null
}
