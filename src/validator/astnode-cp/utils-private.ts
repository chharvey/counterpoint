import {
	OBJ,
	TYPE,
} from '../../index.js';
import type {CPConfig} from '../../core/index.js';
import {Validator} from '../index.js';



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
	return [t0, t1].every((t) => t.isSubtypeOf(TYPE.INT.union(TYPE.FLOAT)));
}

export function bothInts(t0: TYPE.Type, t1: TYPE.Type): boolean {
	return [t0, t1].every((t) => t.isSubtypeOf(TYPE.INT));
}

export function bothFloats(t0: TYPE.Type, t1: TYPE.Type): boolean {
	return [t0, t1].every((t) => t.isSubtypeOf(TYPE.FLOAT));
}

export function eitherFloats(t0: TYPE.Type, t1: TYPE.Type): boolean {
	return [t0, t1].some((t) => t.isSubtypeOf(TYPE.FLOAT));
}

export function neitherFloats(t0: TYPE.Type, t1: TYPE.Type): boolean {
	return !eitherFloats(t0, t1);
}
export function oneFloats(t0: TYPE.Type, t1: TYPE.Type): boolean {
	return eitherFloats(t0, t1) && !bothFloats(t0, t1);
}



export function valueOfTokenNumber(source: string, config: CPConfig): OBJ.Integer | OBJ.Float {
	const [cooked, is_float]: [number, boolean] = Validator.cookTokenNumber(source, config);
	return (is_float) ? new OBJ.Float(cooked) : new OBJ.Integer(BigInt(cooked));
}
