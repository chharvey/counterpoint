import {SolidType} from './package.js';



export function bothNumeric(t0: SolidType, t1: SolidType): boolean {
	const int_float: SolidType = SolidType.INT.union(SolidType.FLOAT);
	return t0.isSubtypeOf(int_float) && t1.isSubtypeOf(int_float);
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
