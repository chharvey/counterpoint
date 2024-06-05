import type binaryen from 'binaryen';
import {
	SolidConfig,
	CONFIG_DEFAULT,
	SolidTypeUnit,
	SolidNull,
	SolidBoolean,
	Int16,
	Float64,
	SolidString,
} from '../src/index.js';



export const CONFIG_FOLDING_OFF: SolidConfig = {
	...CONFIG_DEFAULT,
	compilerOptions: {
		...CONFIG_DEFAULT.compilerOptions,
		constantFolding: false,
	},
};



export function typeConstInt(x: bigint): SolidTypeUnit<Int16> {
	return new Int16(x).toType();
}
export function typeConstFloat(x: number): SolidTypeUnit<Float64> {
	return new Float64(x).toType();
}
export function typeConstStr(x: string): SolidTypeUnit<SolidString> {
	return new SolidString(x).toType();
}



export function buildConstNull(mod: binaryen.Module): binaryen.ExpressionRef {
	return SolidNull.NULL.build(mod);
}

export function buildConstBool(mod: binaryen.Module, b: boolean): binaryen.ExpressionRef {
	return b ? SolidBoolean.TRUE.build(mod) : SolidBoolean.FALSE.build(mod);
}

export function buildConstInt(mod: binaryen.Module, x: bigint): binaryen.ExpressionRef {
	return (
		(x === 0n) ? Int16.ZERO :
		(x === 1n) ? Int16.UNIT :
		new Int16(x)
	).build(mod);
}
export function buildConstFloat(mod: binaryen.Module, x: number): binaryen.ExpressionRef {
	return new Float64(x).build(mod);
}
