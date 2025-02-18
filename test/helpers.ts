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



export function typeUnit(value: bigint): TYPE.Unit<VALUE.Integer>;
export function typeUnit(value: number): TYPE.Unit<VALUE.Float>;
export function typeUnit(value: string): TYPE.Unit<VALUE.String>;
export function typeUnit(value: bigint | number | string): TYPE.Unit<VALUE.Integer | VALUE.Float | VALUE.String> {
	return (
		value === 0n              ? VALUE.INT_0 :
		value === 1n              ? VALUE.INT_1 :
		Object.is(value,  0.0)    ? VALUE.FLOAT_0 :
		Object.is(value, -0.0)    ? VALUE.FLOAT_N0 :
		value === ''              ? VALUE.STR_EMPTY :
		typeof value === 'bigint' ? new VALUE.Integer(value) :
		typeof value === 'number' ? new VALUE.Float(value) :
		typeof value === 'string' ? new VALUE.String(value) :
		assert.fail(new TypeError(`Did not expect type ${ typeof value }.`))
	).toType();
}



export function buildConst(builder: Builder, value: null | boolean | bigint | number | [] = null): binaryen.ExpressionRef {
	return (
		value === null            ? VALUE.NULL :
		value === false           ? VALUE.FALSE :
		value === true            ? VALUE.TRUE :
		value === 0n              ? VALUE.INT_0 :
		value === 1n              ? VALUE.INT_1 :
		Object.is(value,  0.0)    ? VALUE.FLOAT_0 :
		Object.is(value, -0.0)    ? VALUE.FLOAT_N0 :
		typeof value === 'bigint' ? new VALUE.Integer(value) :
		typeof value === 'number' ? new VALUE.Float(value) :
		Array.isArray(value)      ? new VALUE.Tuple() :
		assert.fail(new TypeError(`Did not expect type ${ typeof value }.`))
	).build(builder);
}



export function singletonTuple(builder: Builder, item: binaryen.ExpressionRef): binaryen.ExpressionRef {
	return builder.module.tuple.make([item, buildConst(builder)]);
}
