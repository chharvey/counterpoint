export const defaultComparator: <T>(a: T, b: T) => boolean = (a, b) => a === b || Object.is(a, b);
