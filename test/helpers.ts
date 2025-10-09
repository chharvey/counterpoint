import * as assert from 'node:assert';
import type binaryen from 'binaryen';
import {
	type CPConfig,
	CONFIG_DEFAULT,
	AST,
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



/**
 * Generate an {@link AST.ASTNodeGoal} containing a Counterpoint script and run checks on it,
 * then return various aspects of the node.
 * @param source         the source text of the Counterpoint script
 * @param opts           various options for compiling
 * @param opts.varCheck  Should the VarCheck  algorithm be performed? (defaults true)
 * @param opts.typeCheck Should the TypeCheck algorithm be performed? (defaults true) (only done if `varCheck` is true)
 * @param opts.build     Should the Build     algorithm be performed? (defaults true) (only done if `varCheck` and `typeCheck` are true)
 * @param config         compiler config options
 * @return               the `ASTNodeGoal` instance and some properties of it
 */
export function setupScript(
	source: string,
	config: CPConfig | null = CONFIG_DEFAULT,
	opts:   {varCheck?: boolean, typeCheck?: boolean, build?: boolean} = {},
): {
	goal:  AST.ASTNodeGoal,
	stmts: NonNullable<typeof goal.block>['children'],
	mod:   typeof goal.builder.module,
} {
	const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(source, config ?? CONFIG_DEFAULT);
	assert.ok(goal.block, 'Expected ASTNodeGoal to contain a block.');
	opts.varCheck  ??= true;
	opts.typeCheck ??= true;
	opts.build     ??= true;
	opts.varCheck &&                                 goal.varCheck();
	opts.varCheck && opts.typeCheck &&               goal.typeCheck();
	opts.varCheck && opts.typeCheck && opts.build && goal.build();
	return {
		goal,
		stmts: goal.block.children,
		mod:   goal.builder.module,
	};
}



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



export function buildConst(builder: Builder, value: null | boolean | symbol | bigint | number | string | [] = null): binaryen.ExpressionRef {
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
		Array.isArray(value)      ? new VALUE.Tuple() :
		assert.fail(new TypeError(`Did not expect type ${ typeof value }.`))
	).build(builder);
}



export function singletonTuple(builder: Builder, item: binaryen.ExpressionRef): binaryen.ExpressionRef {
	return builder.module.tuple.make([item, buildConst(builder)]);
}
