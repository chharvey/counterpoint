import * as assert from 'assert';
import type binaryen from 'binaryen';
import {
	type CPConfig,
	CONFIG_DEFAULT,
	OBJ,
	type TYPE,
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



export function typeUnit(value: bigint): TYPE.TypeUnit<OBJ.Integer>;
export function typeUnit(value: number): TYPE.TypeUnit<OBJ.Float>;
export function typeUnit(value: string): TYPE.TypeUnit<OBJ.String>;
export function typeUnit(value: bigint | number | string): TYPE.TypeUnit<OBJ.Integer | OBJ.Float | OBJ.String> {
	return (
		value === 0n              ? OBJ.Integer.ZERO :
		value === 1n              ? OBJ.Integer.UNIT :
		typeof value === 'bigint' ? new OBJ.Integer(value) :
		typeof value === 'number' ? new OBJ.Float(value) :
		typeof value === 'string' ? new OBJ.String(value) :
		assert.fail(new TypeError(`Did not expect type ${ typeof value }.`))
	).toType();
}



export function buildConst(mod: binaryen.Module, value: null | boolean | bigint | number = null): binaryen.ExpressionRef {
	return (
		value === null            ? OBJ.Null.NULL :
		value === false           ? OBJ.Boolean.FALSE :
		value === true            ? OBJ.Boolean.TRUE :
		value === 0n              ? OBJ.Integer.ZERO :
		value === 1n              ? OBJ.Integer.UNIT :
		typeof value === 'bigint' ? new OBJ.Integer(value) :
		typeof value === 'number' ? new OBJ.Float(value) :
		assert.fail(new TypeError(`Did not expect type ${ typeof value }.`))
	).build(mod);
}
