export type Simplify<T> = { [K in keyof T]: T[K] } & {}

export type Overwrite<A, B> = Omit<A, keyof B> & B

export type NonEmptyArray<T> = [T, ...T[]]
