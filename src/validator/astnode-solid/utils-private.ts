import {SolidType} from './package.js';



export enum ValidFunctionName {
	LIST = 'List',
	DICT = 'Dict',
	SET  = 'Set',
	MAP  = 'Map',
};

export function invalidFunctionName(source: string): never {
	throw new SyntaxError(`Unexpected token: ${ source }; expected \`${ Object.values(ValidFunctionName).join(' | ') }\`.`);
}



export function bothNumeric(t0: SolidType, t1: SolidType): boolean {
	return [t0, t1].every((t) => t.isSubtypeOf(SolidType.INT.union(SolidType.FLOAT)));
}

export function bothInts(t0: SolidType, t1: SolidType): boolean {
	return [t0, t1].every((t) => t.isSubtypeOf(SolidType.INT));
}

export function bothFloats(t0: SolidType, t1: SolidType): boolean {
	return [t0, t1].every((t) => t.isSubtypeOf(SolidType.FLOAT));
}

export function eitherFloats(t0: SolidType, t1: SolidType): boolean {
	return [t0, t1].some((t) => t.isSubtypeOf(SolidType.FLOAT));
}

export function neitherFloats(t0: SolidType, t1: SolidType): boolean {
	return !eitherFloats(t0, t1)
}
export function oneFloats(t0: SolidType, t1: SolidType): boolean {
	return eitherFloats(t0, t1) && !bothFloats(t0, t1)
}
