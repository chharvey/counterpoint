import type binaryen from 'binaryen';
import {
	type CPConfig,
	CONFIG_DEFAULT,
	OBJ,
	TYPE,
} from '../src/index.js';



export const CONFIG_RADICES_SEPARATORS_ON: CPConfig = {
	...CONFIG_DEFAULT,
	languageFeatures: {
		...CONFIG_DEFAULT.languageFeatures,
		integerRadices:    true,
		numericSeparators: true,
	},
};

export const CONFIG_FOLDING_OFF: CPConfig = {
	...CONFIG_DEFAULT,
	compilerOptions: {
		...CONFIG_DEFAULT.compilerOptions,
		constantFolding: false,
	},
};

export const CONFIG_COERCION_OFF: CPConfig = {
	...CONFIG_DEFAULT,
	compilerOptions: {
		...CONFIG_DEFAULT.compilerOptions,
		intCoercion: false,
	},
};

export const CONFIG_FOLDING_COERCION_OFF: CPConfig = {
	...CONFIG_DEFAULT,
	compilerOptions: {
		...CONFIG_DEFAULT.compilerOptions,
		constantFolding: false,
		intCoercion:     false,
	},
};



export function typeUnitInt(x: bigint): TYPE.TypeUnit<OBJ.Integer> {
	return new OBJ.Integer(x).toType();
}
export function typeUnitFloat(x: number): TYPE.TypeUnit<OBJ.Float> {
	return new OBJ.Float(x).toType();
}
export function typeUnitStr(x: string): TYPE.TypeUnit<OBJ.String> {
	return new OBJ.String(x).toType();
}



export function default_bin_values(mod: binaryen.Module): {
	readonly int:   binaryen.ExpressionRef,
	readonly float: binaryen.ExpressionRef,
} {
	return {
		int:   TYPE.INT   .defaultBinValue(mod),
		float: TYPE.FLOAT .defaultBinValue(mod),
	} as const;
}



export function buildConstInt(x: bigint, mod: binaryen.Module): binaryen.ExpressionRef {
	return (
		(x === 0n) ? OBJ.Integer.ZERO :
		(x === 1n) ? OBJ.Integer.UNIT :
		new OBJ.Integer(x)
	).build(mod);
}
export function buildConstFloat(x: number, mod: binaryen.Module): binaryen.ExpressionRef {
	return new OBJ.Float(x).build(mod);
}
export function buildConvert(x: bigint, mod: binaryen.Module): binaryen.ExpressionRef {
	return mod.f64.convert_u.i32(buildConstInt(x, mod));
}
