import type binaryen from 'binaryen';
import {
	SolidConfig,
	CONFIG_DEFAULT,
	SolidType,
	SolidTypeUnit,
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



export function default_bin_values(mod: binaryen.Module) {
	return {
		int:   SolidType.INT   .defaultBinValue(mod),
		float: SolidType.FLOAT .defaultBinValue(mod),
	} as const;
}



export function buildConstInt(x: bigint, mod: binaryen.Module): binaryen.ExpressionRef {
	return (
		(x === 0n) ? Int16.ZERO :
		(x === 1n) ? Int16.UNIT :
		new Int16(x)
	).build(mod);
}
export function buildConstFloat(x: number, mod: binaryen.Module): binaryen.ExpressionRef {
	return new Float64(x).build(mod);
}
export function buildConvert(x: bigint, mod: binaryen.Module): binaryen.ExpressionRef {
	return mod.f64.convert_u.i32(buildConstInt(x, mod));
}
