/** Returns the constructor type or any possible subtype of the given type. */
export type ConstructorType<T> = new (...args: any[]) => T; // eslint-disable-line @typescript-eslint/no-explicit-any
