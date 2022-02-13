import {
	SolidType,
	Int16,
	Float64,
	SolidString,
	SolidConfig,
	TOKEN,
	Validator,
} from './package.js';



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



export function valueOfTokenNumber(source: TOKEN.TokenNumber | string, config: SolidConfig): Int16 | Float64 {
	const [cooked, is_float]: [number, boolean] = (typeof source === 'string')
		? Validator.cookTokenNumber(source, config)
		: [source.cook(), source.isFloat];
	return (is_float) ? new Float64(cooked) : new Int16(BigInt(cooked));
}

export function valueOfTokenString(source: TOKEN.TokenString | string, config: SolidConfig): SolidString {
	return new SolidString((typeof source === 'string')
		? Validator.cookTokenString(source, config)
		: source.cook());
}

export function valueOfTokenTemplate(source: TOKEN.TokenTemplate | string): SolidString {
	return new SolidString((typeof source === 'string')
		? Validator.cookTokenTemplate(source)
		: source.cook());
}
