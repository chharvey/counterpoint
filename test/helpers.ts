import * as assert from 'assert';
import type binaryen from 'binaryen';
import {
	type CPConfig,
	CONFIG_DEFAULT,
	OBJ,
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



export function typeUnitInt(x: bigint): TYPE.TypeUnit<OBJ.Integer> {
	return new OBJ.Integer(x).toType();
}
export function typeUnitFloat(x: number): TYPE.TypeUnit<OBJ.Float> {
	return new OBJ.Float(x).toType();
}
export function typeUnitStr(x: string): TYPE.TypeUnit<OBJ.String> {
	return new OBJ.String(x).toType();
}



export function buildConst(builder: Builder, value: null | boolean | bigint | number = null): binaryen.ExpressionRef {
	return (
		value === null            ? OBJ.Null.NULL :
		value === false           ? OBJ.Boolean.FALSE :
		value === true            ? OBJ.Boolean.TRUE :
		value === 0n              ? OBJ.Integer.ZERO :
		value === 1n              ? OBJ.Integer.UNIT :
		typeof value === 'bigint' ? new OBJ.Integer(value) :
		typeof value === 'number' ? new OBJ.Float(value) :
		assert.fail(new TypeError(`Did not expect type ${ typeof value }.`))
	).build(builder);
}
