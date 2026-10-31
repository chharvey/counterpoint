import {TYPE} from '../../../typer/index.ts';



export function bothInts(t0: TYPE.Type, t1: TYPE.Type): boolean {
	return t0.isSubtypeOf(TYPE.INT) && t1.isSubtypeOf(TYPE.INT);
}

export function bothNats(t0: TYPE.Type, t1: TYPE.Type): boolean {
	return t0.isSubtypeOf(TYPE.NAT) && t1.isSubtypeOf(TYPE.NAT);
}

export function bothFloats(t0: TYPE.Type, t1: TYPE.Type): boolean {
	return t0.isSubtypeOf(TYPE.FLOAT) && t1.isSubtypeOf(TYPE.FLOAT);
}

export function bothNumbers(t0: TYPE.Type, t1: TYPE.Type): boolean {
	return t0.isSubtypeOf(TYPE.NUMBER) && t1.isSubtypeOf(TYPE.NUMBER);
}
