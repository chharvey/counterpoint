import * as assert from 'assert';
import type binaryen from 'binaryen';
import {
	type CPConfig,
	CONFIG_DEFAULT,
	VALUE,
	type TYPE,
	type Builder,
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



export function typeUnit(value: bigint): TYPE.TypeUnit<VALUE.Integer>;
export function typeUnit(value: number): TYPE.TypeUnit<VALUE.Float>;
export function typeUnit(value: string): TYPE.TypeUnit<VALUE.String>;
export function typeUnit(value: bigint | number | string): TYPE.TypeUnit<VALUE.Integer | VALUE.Float | VALUE.String> {
	return (
		value === 0n              ? VALUE.Integer.ZERO :
		value === 1n              ? VALUE.Integer.UNIT :
		typeof value === 'bigint' ? new VALUE.Integer(value) :
		typeof value === 'number' ? new VALUE.Float(value) :
		typeof value === 'string' ? new VALUE.String(value) :
		assert.fail(new TypeError(`Did not expect type ${ typeof value }.`))
	).toType();
}



export function buildConst(builder: Builder, value: null | boolean | bigint | number = null): binaryen.ExpressionRef {
	return (
		value === null            ? VALUE.Null.NULL :
		value === false           ? VALUE.Boolean.FALSE :
		value === true            ? VALUE.Boolean.TRUE :
		value === 0n              ? VALUE.Integer.ZERO :
		value === 1n              ? VALUE.Integer.UNIT :
		typeof value === 'bigint' ? new VALUE.Integer(value) :
		typeof value === 'number' ? new VALUE.Float(value) :
		assert.fail(new TypeError(`Did not expect type ${ typeof value }.`))
	).build(builder);
}
