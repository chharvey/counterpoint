import {
	OBJ,
	TYPE,
} from '../../index.js';
import type {CPConfig} from '../../core/index.js';
import {Validator} from '../index.js';



export type ArgCount = bigint | readonly [bigint, bigint];



export enum ValidIntrinsicName {
	OBJECT = 'Object',
}

export enum ValidFunctionName {
	LIST = 'List',
	DICT = 'Dict',
	SET  = 'Set',
	MAP  = 'Map',
}

export function is_valid_intrinsic_name(source: string): source is ValidIntrinsicName {
	return Object.values<string>(ValidIntrinsicName).includes(source);
}

export function invalid_function_name(source: string): never {
	throw new SyntaxError(`Unexpected token: ${ source }; expected \`${ Object.values(ValidFunctionName).join(' | ') }\`.`);
}



export function bothNumeric(t0: TYPE.Type, t1: TYPE.Type): boolean;
export function bothNumeric(v0: OBJ.Object, v1: OBJ.Object): boolean;
export function bothNumeric(arg0: TYPE.Type | OBJ.Object, arg1: TYPE.Type | OBJ.Object): boolean {
	const int_float: TYPE.Type = TYPE.INT.union(TYPE.FLOAT);
	return (arg0 instanceof TYPE.Type && arg1 instanceof TYPE.Type)
		? arg0.isSubtypeOf(int_float) && arg1.isSubtypeOf(int_float)
		: arg0 instanceof OBJ.Number  && arg1 instanceof OBJ.Number;
}

export function eitherFloats(t0: TYPE.Type, t1: TYPE.Type): boolean;
export function eitherFloats(v0: OBJ.Object, v1: OBJ.Object): boolean;
export function eitherFloats(arg0: TYPE.Type | OBJ.Object, arg1: TYPE.Type | OBJ.Object): boolean {
	return (arg0 instanceof TYPE.Type && arg1 instanceof TYPE.Type)
		? arg0.isSubtypeOf(TYPE.FLOAT) || arg1.isSubtypeOf(TYPE.FLOAT)
		: arg0 instanceof OBJ.Float    || arg1 instanceof OBJ.Float;
}

export function bothFloats(t0: TYPE.Type, t1: TYPE.Type): boolean;
export function bothFloats(v0: OBJ.Object, v1: OBJ.Object): boolean;
export function bothFloats(arg0: TYPE.Type | OBJ.Object, arg1: TYPE.Type | OBJ.Object): boolean {
	return (arg0 instanceof TYPE.Type && arg1 instanceof TYPE.Type)
		? arg0.isSubtypeOf(TYPE.FLOAT) && arg1.isSubtypeOf(TYPE.FLOAT)
		: arg0 instanceof OBJ.Float    && arg1 instanceof OBJ.Float;
}

export function neitherFloats(t0: TYPE.Type, t1: TYPE.Type): boolean;
export function neitherFloats(v0: OBJ.Object, v1: OBJ.Object): boolean;
export function neitherFloats(arg0: TYPE.Type | OBJ.Object, arg1: TYPE.Type | OBJ.Object): boolean {
	// @ts-expect-error --- both args are either both `TYPE.Type`s or both `OBJ.Object`s
	return !eitherFloats(arg0, arg1);
}

export function oneFloats(t0: TYPE.Type, t1: TYPE.Type): boolean;
export function oneFloats(v0: OBJ.Object, v1: OBJ.Object): boolean;
export function oneFloats(arg0: TYPE.Type | OBJ.Object, arg1: TYPE.Type | OBJ.Object): boolean {
	// @ts-expect-error --- both args are either both `TYPE.Type`s or both `OBJ.Object`s
	return eitherFloats(arg0, arg1) && !bothFloats(arg0, arg1);
}



export function valueOfTokenNumber(source: string, config: CPConfig): OBJ.Integer | OBJ.Float {
	const [cooked, is_float]: [number, boolean] = Validator.cookTokenNumber(source, config);
	return (is_float) ? new OBJ.Float(cooked) : new OBJ.Integer(BigInt(cooked));
}
