import * as assert from 'assert';
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

export const CONFIG_COERCION_OFF: SolidConfig = {
	...CONFIG_DEFAULT,
	compilerOptions: {
		...CONFIG_DEFAULT.compilerOptions,
		intCoercion: false,
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



export function buildConst(mod: binaryen.Module, value: null | boolean | bigint | number = null): binaryen.ExpressionRef {
	return (
		value === null            ? SolidNull.NULL :
		value === false           ? SolidBoolean.FALSE :
		value === true            ? SolidBoolean.TRUE :
		value === 0n              ? Int16.ZERO :
		value === 1n              ? Int16.UNIT :
		typeof value === 'bigint' ? new Int16(value) :
		typeof value === 'number' ? new Float64(value) :
		assert.fail(new TypeError(`Did not expect type ${ typeof value }.`))
	).build(mod);
}
