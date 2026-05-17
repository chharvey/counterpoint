import * as assert from 'node:assert';
import type * as binaryen from 'binaryen.ts';
import {
	AST,
	VALUE,
	type TYPE,
	Optimizer,
	BinConst,
	Builder,
} from '../src/index.ts';



const TYPE_UNIT_MEMO = new Map<symbol | bigint | number | string, TYPE.Unit<VALUE.Symbol | VALUE.Integer | VALUE.Float | VALUE.String>>();
const TYPE_UNIT_MEMO_NAT = new Map<bigint, TYPE.Unit<VALUE.Natural>>();



/**
 * Generate an {@link AST.Goal} containing a Counterpoint script and run checks on it,
 * then return various aspects of the node.
 * @param source         the source text of the Counterpoint script
 * @param opts           various options for compiling
 * @param opts.varCheck  Should the VarCheck  algorithm be performed? (defaults true)
 * @param opts.typeCheck Should the TypeCheck algorithm be performed? (defaults true) (only done if `varCheck` is true)
 * @param opts.lower     Should the Lower     algorithm be performed? (defaults true) (only done if `varCheck` and `typeCheck` are true)
 * @param opts.codegen   Should the Codegen   algorithm be performed? (defaults true) (only done if `varCheck`, `typeCheck`, and `lower` are true)
 * @return               the `Goal` instance and some properties of it
 */
export function setupScript(
	source: string,
	opts:   {varCheck?: boolean, typeCheck?: boolean, lower?: boolean, codegen?: boolean} = {},
): {
	readonly goal:  AST.Goal,
	readonly stmts: NonNullable<typeof goal.block>['children'],
	readonly opt:   Optimizer,
	readonly cg:    Builder,
	readonly mod:   binaryen.Module,
	readonly wasm:  binaryen.ExpressionBuilder,
} {
	const goal: AST.Goal = AST.Goal.fromSource(source);
	const opt = new Optimizer();
	const cg  = new Builder();
	assert.ok(goal.block, 'Expected AST.Goal to contain a block.');
	opts.varCheck  ??= true;
	opts.typeCheck ??= true;
	opts.lower     ??= true;
	opts.codegen   ??= true;
	opts.varCheck &&                                                 goal.varCheck();
	opts.varCheck && opts.typeCheck &&                               goal.typeCheck();
	opts.varCheck && opts.typeCheck && opts.lower &&                 goal.lower(opt);
	opts.varCheck && opts.typeCheck && opts.lower && opts.codegen && opt.codegen(cg);
	return {
		goal,
		opt,
		cg,
		stmts: goal.block.children,
		mod:   cg.vm.mod,
		wasm:  cg.vm.mod.wasm,
	};
}



export function typeUnit(value: symbol, name?: string): TYPE.Unit<VALUE.Symbol>;
export function typeUnit(value: bigint): TYPE.Unit<VALUE.Integer>;
export function typeUnit(value: bigint, t: 'nat'): TYPE.Unit<VALUE.Natural>;
export function typeUnit(value: number): TYPE.Unit<VALUE.Float>;
export function typeUnit(value: string): TYPE.Unit<VALUE.String>;
export function typeUnit(value: symbol | bigint | number | string, tag?: string): TYPE.Unit<VALUE.Symbol | VALUE.Integer | VALUE.Natural | VALUE.Float | VALUE.String> {
	if (typeof value === 'bigint' && tag === 'nat') {
		TYPE_UNIT_MEMO_NAT.has(value) || TYPE_UNIT_MEMO_NAT.set(value, (
			value === 0n              ? VALUE.NAT_0 :
			value === 1n              ? VALUE.NAT_1 :
			typeof value === 'bigint' ? new VALUE.Natural(value) :
			assert.fail(new TypeError(`Did not expect type ${ typeof value }.`))
		).toType());
		return TYPE_UNIT_MEMO_NAT.get(value)!;
	}
	TYPE_UNIT_MEMO.has(value) || TYPE_UNIT_MEMO.set(value, (
		value === 0n              ? VALUE.INT_0 :
		value === 1n              ? VALUE.INT_1 :
		Object.is(value,  0.0)    ? VALUE.FLOAT_0 :
		Object.is(value, -0.0)    ? VALUE.FLOAT_N0 :
		value === ''              ? VALUE.STR_EMPTY :
		typeof value === 'symbol' ? new VALUE.Symbol(BigInt(value.description ?? ''), tag ?? '') :
		typeof value === 'bigint' ? new VALUE.Integer(value) :
		typeof value === 'number' ? new VALUE.Float(value) :
		typeof value === 'string' ? new VALUE.String(value) :
		assert.fail(new TypeError(`Did not expect type ${ typeof value }.`))
	).toType());
	return TYPE_UNIT_MEMO.get(value)!;
}



export function genConst(cg: Builder, value?: null | boolean | symbol | number | string): binaryen.ExpressionRef;
export function genConst(cg: Builder, value: bigint, t?: 'nat'): binaryen.ExpressionRef;
export function genConst(cg: Builder, value: null | boolean | symbol | bigint | number | string = null, t?: 'nat'): binaryen.ExpressionRef {
	switch (value) {
		case null:  { return cg.getConst(BinConst.NULL); }
		case false: { return cg.getConst(BinConst.FALSE); }
		case true:  { return cg.getConst(BinConst.TRUE); }
	}
	if (t === 'nat') {
		return (
			value === 0n              ? VALUE.NAT_0 :
			value === 1n              ? VALUE.NAT_1 :
			typeof value === 'bigint' ? new VALUE.Natural(value) :
			assert.fail(new TypeError(`Did not expect type ${ typeof value }.`))
		).codegen(cg);
	}
	return (
		value === 0n              ? VALUE.INT_0 :
		value === 1n              ? VALUE.INT_1 :
		Object.is(value,  0.0)    ? VALUE.FLOAT_0 :
		Object.is(value, -0.0)    ? VALUE.FLOAT_N0 :
		typeof value === 'symbol' ? new VALUE.Symbol(BigInt(value.description ?? ''), '') :
		typeof value === 'bigint' ? new VALUE.Integer(value) :
		typeof value === 'number' ? new VALUE.Float(value) :
		typeof value === 'string' ? new VALUE.String(value) :
		assert.fail(new TypeError(`Did not expect type ${ typeof value }.`))
	).codegen(cg);
}
