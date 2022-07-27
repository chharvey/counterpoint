import {
	TYPE,
	Int16,
	Float64,
	CPConfig,
	Validator,
} from './package.js';



export enum ValidFunctionName {
	LIST = 'List',
	DICT = 'Dict',
	SET  = 'Set',
	MAP  = 'Map',
};

export function invalidFunctionName(source: string): never {
	throw new SyntaxError(`Unexpected token: ${ source }; expected \`${ Object.values(ValidFunctionName).join(' | ') }\`.`);
}



export function bothNumeric(t0: TYPE.Type, t1: TYPE.Type): boolean {
	const int_float: TYPE.Type = TYPE.Type.INT.union(TYPE.Type.FLOAT);
	return t0.isSubtypeOf(int_float) && t1.isSubtypeOf(int_float);
}
export function eitherFloats(t0: TYPE.Type, t1: TYPE.Type): boolean {
	return t0.isSubtypeOf(TYPE.Type.FLOAT) || t1.isSubtypeOf(TYPE.Type.FLOAT);
}
export function bothFloats(t0: TYPE.Type, t1: TYPE.Type): boolean {
	return t0.isSubtypeOf(TYPE.Type.FLOAT) && t1.isSubtypeOf(TYPE.Type.FLOAT);
}
export function neitherFloats(t0: TYPE.Type, t1: TYPE.Type): boolean {
	return !eitherFloats(t0, t1)
}
export function oneFloats(t0: TYPE.Type, t1: TYPE.Type): boolean {
	return !neitherFloats(t0, t1) && !bothFloats(t0, t1)
}



export function valueOfTokenNumber(source: string, config: CPConfig): Int16 | Float64 {
	const [cooked, is_float]: [number, boolean] = Validator.cookTokenNumber(source, config);
	return (is_float) ? new Float64(cooked) : new Int16(BigInt(cooked));
}
