export * from './Parse'
export * from './Resolver'
export * from './Registry'
export * from './Container'

/**
 * Inferred resolve-type of a Promise
 */
export type ResolveType<T> = T extends Promise<infer R> ? R : T

/**
 * Inferred return-type of a function. Unlike `ReturnType<T>`, when a function is
 * async the inferred type is the resolve-type of the returned Promise.
 */
export type ResolveReturnType<T extends (...args: any[]) => any> = ResolveType<ReturnType<T>>
