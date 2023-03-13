import {
	TYPE,
	OBJ,
	CPConfig,
	Validator,
} from './package.js';



export type ArgCount = bigint | readonly [bigint, bigint];



export enum ValidFunctionName {
	LIST = 'List',
	DICT = 'Dict',
	SET  = 'Set',
	MAP  = 'Map',
}

export function invalidFunctionName(source: string): never {
	throw new SyntaxError(`Unexpected token: ${ source }; expected \`${ Object.values(ValidFunctionName).join(' | ') }\`.`);
}



export function bothNumeric(t0: TYPE.Type, t1: TYPE.Type): boolean {
	const int_float: TYPE.Type = TYPE.INT.union(TYPE.FLOAT);
	return t0.isSubtypeOf(int_float) && t1.isSubtypeOf(int_float);
}
export function eitherFloats(t0: TYPE.Type, t1: TYPE.Type): boolean {
	return t0.isSubtypeOf(TYPE.FLOAT) || t1.isSubtypeOf(TYPE.FLOAT);
}
export function bothFloats(t0: TYPE.Type, t1: TYPE.Type): boolean {
	return t0.isSubtypeOf(TYPE.FLOAT) && t1.isSubtypeOf(TYPE.FLOAT);
}
export function neitherFloats(t0: TYPE.Type, t1: TYPE.Type): boolean {
	return !eitherFloats(t0, t1);
}
export function oneFloats(t0: TYPE.Type, t1: TYPE.Type): boolean {
	return !neitherFloats(t0, t1) && !bothFloats(t0, t1);
}



export function valueOfTokenNumber(source: string, config: CPConfig): OBJ.Integer | OBJ.Float {
	const [cooked, is_float]: [number, boolean] = Validator.cookTokenNumber(source, config);
	return (is_float) ? new OBJ.Float(cooked) : new OBJ.Integer(BigInt(cooked));
}
