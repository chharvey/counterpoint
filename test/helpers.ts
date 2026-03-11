import * as assert from 'node:assert';
import type binaryen from 'binaryen';
import {
	type CPConfig,
	CONFIG_DEFAULT,
	VALUE,
	type TYPE,
	type Builder,
} from '../src/index.ts';



const TYPE_UNIT_MEMO = new Map<symbol | bigint | number | string, TYPE.Unit<VALUE.Symbol | VALUE.Integer | VALUE.Float | VALUE.String>>();



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



export function typeUnit(value: symbol): TYPE.Unit<VALUE.Symbol>;
export function typeUnit(value: bigint): TYPE.Unit<VALUE.Integer>;
export function typeUnit(value: number): TYPE.Unit<VALUE.Float>;
export function typeUnit(value: string): TYPE.Unit<VALUE.String>;
export function typeUnit(value: symbol | bigint | number | string): TYPE.Unit<VALUE.Symbol | VALUE.Integer | VALUE.Float | VALUE.String> {
	TYPE_UNIT_MEMO.has(value) || TYPE_UNIT_MEMO.set(value, (
		value === 0n              ? VALUE.INT_0 :
		value === 1n              ? VALUE.INT_1 :
		Object.is(value,  0.0)    ? VALUE.FLOAT_0 :
		Object.is(value, -0.0)    ? VALUE.FLOAT_N0 :
		value === ''              ? VALUE.STR_EMPTY :
		typeof value === 'symbol' ? new VALUE.Symbol(BigInt(value.description ?? ''), '') :
		typeof value === 'bigint' ? new VALUE.Integer(value) :
		typeof value === 'number' ? new VALUE.Float(value) :
		typeof value === 'string' ? new VALUE.String(value) :
		assert.fail(new TypeError(`Did not expect type ${ typeof value }.`))
	).toType());
	return TYPE_UNIT_MEMO.get(value)!;
}



export function genConst(mod: binaryen.Module, value: null | boolean | symbol | bigint | number | string = null): binaryen.ExpressionRef {
	return (
		value === null            ? VALUE.NULL :
		value === false           ? VALUE.FALSE :
		value === true            ? VALUE.TRUE :
		value === 0n              ? VALUE.INT_0 :
		value === 1n              ? VALUE.INT_1 :
		Object.is(value,  0.0)    ? VALUE.FLOAT_0 :
		Object.is(value, -0.0)    ? VALUE.FLOAT_N0 :
		typeof value === 'symbol' ? new VALUE.Symbol(BigInt(value.description ?? ''), '') :
		typeof value === 'bigint' ? new VALUE.Integer(value) :
		typeof value === 'number' ? new VALUE.Float(value) :
		typeof value === 'string' ? assert.fail('String argument to `genConst` is not yet supported.') :
		assert.fail(new TypeError(`Did not expect type ${ typeof value }.`))
	).codegen(mod).vect;
}



export function buildConst(builder: Builder, value: null | boolean | symbol | bigint | number | string = null): binaryen.ExpressionRef {
	return (
		value === null            ? VALUE.NULL :
		value === false           ? VALUE.FALSE :
		value === true            ? VALUE.TRUE :
		value === 0n              ? VALUE.INT_0 :
		value === 1n              ? VALUE.INT_1 :
		Object.is(value,  0.0)    ? VALUE.FLOAT_0 :
		Object.is(value, -0.0)    ? VALUE.FLOAT_N0 :
		typeof value === 'symbol' ? new VALUE.Symbol(BigInt(value.description ?? ''), '') :
		typeof value === 'bigint' ? new VALUE.Integer(value) :
		typeof value === 'number' ? new VALUE.Float(value) :
		typeof value === 'string' ? assert.fail('String argument to `buildConst` is not yet supported.') :
		assert.fail(new TypeError(`Did not expect type ${ typeof value }.`))
	).build(builder);
}
