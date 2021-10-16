import {
	SolidType,
	Int16,
} from './package.js';



export function bothNumeric(t0: SolidType, t1: SolidType): boolean {
	return t0.isSubtypeOf(Int16.union(SolidType.FLOAT)) && t1.isSubtypeOf(Int16.union(SolidType.FLOAT));
}
export function eitherFloats(t0: SolidType, t1: SolidType): boolean {
	return t0.isSubtypeOf(SolidType.FLOAT) || t1.isSubtypeOf(SolidType.FLOAT);
}
export function bothFloats(t0: SolidType, t1: SolidType): boolean {
	return t0.isSubtypeOf(SolidType.FLOAT) && t1.isSubtypeOf(SolidType.FLOAT);
}
export function neitherFloats(t0: SolidType, t1: SolidType): boolean {
	return !eitherFloats(t0, t1)
}
export function oneFloats(t0: SolidType, t1: SolidType): boolean {
	return !neitherFloats(t0, t1) && !bothFloats(t0, t1)
}



/** Implementation of `xjs.Array.forEachAggregated` until it is released. */
export function forEachAggregated<T>(array: readonly T[], callback: (item: T) => void): void {
	const errors: readonly Error[] = array.map((it) => {
		try {
			callback(it);
			return null;
		} catch (err) {
			return (err instanceof Error) ? err : new Error(`${ err }`);
		}
	}).filter((e): e is Error => e instanceof Error);
	if (errors.length) {
		throw (errors.length === 1)
			? errors[0]
			: new AggregateError(errors, errors.map((err) => err.message).join('\n'));
	}
}
/** Implementation of `xjs.Array.mapAggregated` until it is released. */
export function mapAggregated<T, U>(array: readonly T[], callback: (item: T) => U): U[] {
	const successes: U[]     = [];
	const errors:    Error[] = [];
	array.forEach((it) => {
		let success: U;
		try {
			success = callback(it);
		} catch (err) {
			errors.push((err instanceof Error) ? err : new Error(`${ err }`));
			return;
		}
		successes.push(success);
	});
	if (errors.length) {
		throw (errors.length === 1)
			? errors[0]
			: new AggregateError(errors, errors.map((err) => err.message).join('\n'));
	} else {
		return successes;
	}
}
