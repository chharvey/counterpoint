import {
	SolidType,
	SolidObject,
	SolidNumber,
	Int16,
	Float64,
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



export function bothNumeric(t0: SolidType, t1: SolidType): boolean;
export function bothNumeric(v0: SolidObject, v1: SolidObject): boolean;
export function bothNumeric(arg0: SolidType | SolidObject, arg1: SolidType | SolidObject): boolean {
	const int_float: SolidType = SolidType.INT.union(SolidType.FLOAT);
	return (arg0 instanceof SolidType && arg1 instanceof SolidType)
		? [arg0, arg1].every((arg) => arg.isSubtypeOf(int_float))
		: [arg0, arg1].every((arg) => arg instanceof SolidNumber);
}

export function bothInts(t0: SolidType, t1: SolidType): boolean;
export function bothInts(v0: SolidObject, v1: SolidObject): boolean;
export function bothInts(arg0: SolidType | SolidObject, arg1: SolidType | SolidObject): boolean {
	return (arg0 instanceof SolidType && arg1 instanceof SolidType)
		? [arg0, arg1].every((arg) => arg.isSubtypeOf(SolidType.INT))
		: [arg0, arg1].every((arg) => arg instanceof Int16);
}

export function bothFloats(t0: SolidType, t1: SolidType): boolean;
export function bothFloats(v0: SolidObject, v1: SolidObject): boolean;
export function bothFloats(arg0: SolidType | SolidObject, arg1: SolidType | SolidObject): boolean {
	return (arg0 instanceof SolidType && arg1 instanceof SolidType)
		? [arg0, arg1].every((arg) => arg.isSubtypeOf(SolidType.FLOAT))
		: [arg0, arg1].every((arg) => arg instanceof Float64);
}

export function eitherFloats(t0: SolidType, t1: SolidType): boolean;
export function eitherFloats(v0: SolidObject, v1: SolidObject): boolean;
export function eitherFloats(arg0: SolidType | SolidObject, arg1: SolidType | SolidObject): boolean {
	return (arg0 instanceof SolidType && arg1 instanceof SolidType)
		? [arg0, arg1].some((arg) => arg.isSubtypeOf(SolidType.FLOAT))
		: [arg0, arg1].some((arg) => arg instanceof Float64);
}

export function neitherFloats(t0: SolidType, t1: SolidType): boolean;
export function neitherFloats(v0: SolidObject, v1: SolidObject): boolean;
export function neitherFloats(arg0: SolidType | SolidObject, arg1: SolidType | SolidObject): boolean {
	// @ts-expect-error --- both args are either both `SolidType`s or both `SolidObject`s
	return !eitherFloats(arg0, arg1);
}

export function oneFloats(t0: SolidType, t1: SolidType): boolean;
export function oneFloats(v0: SolidObject, v1: SolidObject): boolean;
export function oneFloats(arg0: SolidType | SolidObject, arg1: SolidType | SolidObject): boolean {
	// @ts-expect-error --- both args are either both `SolidType`s or both `SolidObject`s
	return eitherFloats(arg0, arg1) && !bothFloats(arg0, arg1);
}
