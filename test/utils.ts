import * as assert from 'node:assert';
import binaryen from 'binaryen';
import * as xjs from 'extrajs';
import {
	type ConstructorType,
	assert_instanceof,
	AST,
	VALUE,
	TYPE,
	Builder,
	BinConst,
	CodeGenerator,
} from '../src/index.ts';



export function extract_tokens(template: string): string[] {
	return template.trim().replace(/\n\t+/g, '  ').split('  ');
}

export function extract_lines(strings: TemplateStringsArray, ...interps: unknown[]): string[] {
	return String.raw({raw: strings}, ...interps).split('\n').map((line) => line.trim()).filter((line) => !!line);
}

export function repeat<T>(value: T, times: number): T[] {
	return Array<T>(times).fill(value);
}



/**
 * Asserts that two arrays have the same item (by `assert.strictEqual`) at each index.
 */
export function assert_shallowStrictEqual<T>(actual: unknown[], expected: T[], message?: Parameters<typeof assert.strictEqual>[2]): asserts actual is T[] {
	if (actual === expected) {
		return;
	}
	if (message) {
		assert.strictEqual(actual.length, expected.length, message);
		return xjs.Array.forEachAggregated(actual, (item, i) => assert.strictEqual(item, expected[i], message));
	} else {
		assert.strictEqual(actual.length, expected.length);
		return xjs.Array.forEachAggregated(actual, (item, i) => assert.strictEqual(item, expected[i]));
	}
}

type ValidationObject = {cons: ConstructorType<Error>} & (
	| {message: string}
	| {errors: ValidationObject[]}
);
export function assertAssignable(actual: Error, validation: ValidationObject): void {
	assert_instanceof(actual, validation.cons);
	if ('message' in validation) {
		return assert.strictEqual(actual.message, validation.message);
	} else if ('errors' in validation) {
		assert.ok(
			validation.cons === AggregateError || validation.cons.prototype instanceof AggregateError, // validation.cons extends AggregateError
			`The \`cons\` value of validation object ${ validation.cons } with an \`errors\` property must be \`AggregateError\` or a subclass of it.`,
		);
		assert.strictEqual(
			(actual as AggregateError).errors.length,
			validation.errors.length,
			'Number of actual sub-errors should equal number of validation sub-errors.',
		);
		return xjs.Array.forEachAggregated(
			validation.errors,
			(subvalidation, i) => assertAssignable((actual as AggregateError).errors[i] as Error, subvalidation),
		);
	}
}



/**
 * Assert equal types. First compares by `assert.deepStrictEqual`,
 * but if that fails, compares by `Type#equals`.
 * @param actual   the actual type
 * @param expected what `actual` is expected to equal
 * @throws {AssertionError} actual and expected fail equality
 */
export function assertEqualTypes(actual: TYPE.Type, expected: TYPE.Type): void;
/**
 * Assert equal types. First compares by `assert.deepStrictEqual`,
 * but if that fails, compares by `Type#equals`.
 * @param actual   an array of actual types
 * @param expected an array of what `actual` is expected to equal
 * @throws {AssertionError} if a corresponding type fails equality
 */
export function assertEqualTypes(actual: readonly TYPE.Type[], expected: readonly TYPE.Type[]): void;
/**
 * Assert equal types. First compares by `assert.deepStrictEqual`,
 * but if that fails, compares by `Type#equals`.
 * @param types a map of keys and values to compare
 * @throws {AssertionError} if one of the pairs fails equality
 */
export function assertEqualTypes(types: ReadonlyMap<TYPE.Type, TYPE.Type>): void;
export function assertEqualTypes(arg0: TYPE.Type | readonly TYPE.Type[] | ReadonlyMap<TYPE.Type, TYPE.Type>, arg1?: TYPE.Type | readonly TYPE.Type[]): void {
	if (arg0 instanceof Map) {
		return assertEqualTypes([...arg0.keys()], [...arg0.values()]);
	} else if (Array.isArray(arg0)) {
		assert.strictEqual(arg0.length, (arg1 as TYPE.Type[]).length, 'Expected arrays to have the same length.');
		return xjs.Array.forEachAggregated(arg0, (act, i) => assertEqualTypes(act as TYPE.Type, (arg1 as TYPE.Type[])[i]));
	} else {
		if (TYPE.TYPE_CONSTANTS.includes(arg1 as TYPE.Type)) {
			return assert.strictEqual(arg0, arg1);
		} else {
			try {
				return assert.deepStrictEqual(arg0, arg1);
			} catch {
				return assert.ok((arg0 as TYPE.Type).equals(arg1 as TYPE.Type), `${ arg0 as TYPE.Type } == ${ arg1 }`);
			}
		};
	}
}

export function assertEqualBins<Ref extends binaryen.ExpressionRef | binaryen.Module>(actual: Ref, expected: Ref, message?: Parameters<typeof assert.strictEqual>[2]): void;
export function assertEqualBins<Ref extends binaryen.ExpressionRef | binaryen.Module>(actual: readonly Ref[], expected: readonly Ref[]): void;
export function assertEqualBins<Ref extends binaryen.ExpressionRef | binaryen.Module>(bins: ReadonlyMap<Ref, Ref>): void;
export function assertEqualBins<Ref extends binaryen.ExpressionRef | binaryen.Module>(arg0: Ref | readonly Ref[] | ReadonlyMap<Ref, Ref>, arg1?: Ref | readonly Ref[], message?: Parameters<typeof assert.strictEqual>[2]): void {
	if (arg0 instanceof Map) {
		return assertEqualBins([...arg0.keys()], [...arg0.values()]);
	} else if (Array.isArray(arg0)) {
		try {
			return assert.deepStrictEqual(arg0, arg1);
		} catch {
			assert.strictEqual(arg0.length, (arg1 as Ref[]).length, 'Expected arrays to have the same length.');
			return xjs.Array.forEachAggregated(arg0, (act, i) => assertEqualBins(act, (arg1 as Ref[])[i]));
		}
	} else if (message) {
		try {
			return assert.strictEqual(arg0, arg1, message);
		} catch {
			return assert.strictEqual(binaryen.emitText(arg0 as Ref), binaryen.emitText(arg1 as Ref), message);
		}
	} else {
		try {
			return assert.strictEqual(arg0, arg1);
		} catch {
			return assert.strictEqual(binaryen.emitText(arg0 as Ref), binaryen.emitText(arg1 as Ref));
		}
	}
}



const TYPE_UNIT_MEMO = new Map<symbol | bigint | number | string, TYPE.Unit<VALUE.Symbol | VALUE.Integer | VALUE.Float | VALUE.String>>();
const TYPE_UNIT_MEMO_NAT = new Map<bigint, TYPE.Unit<VALUE.Natural>>();
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

export function genConst(cg: CodeGenerator, value?: null | boolean | symbol | number | string): binaryen.ExpressionRef;
export function genConst(cg: CodeGenerator, value: bigint, t?: 'nat'): binaryen.ExpressionRef;
export function genConst(cg: CodeGenerator, value: null | boolean | symbol | bigint | number | string = null, t?: 'nat'): binaryen.ExpressionRef {
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



/**
 * Generate an {@link AST.Goal} containing a Counterpoint script and run checks on it,
 * then return various aspects of the node.
 * @param source         the source text of the Counterpoint script
 * @param opts           various options for compiling
 * @param opts.varCheck  Should the VarCheck  algorithm be performed? (defaults true)
 * @param opts.typeCheck Should the TypeCheck algorithm be performed? (defaults true) (only done if `varCheck` is true)
 * @param opts.build     Should the Build     algorithm be performed? (defaults true) (only done if `varCheck` and `typeCheck` are true)
 * @param opts.codegen   Should the Codegen   algorithm be performed? (defaults true) (only done if `varCheck`, `typeCheck`, and `lower` are true)
 * @return               the `Goal` instance and some properties of it
 */
export function setupScript(
	source: string,
	opts:   {varCheck?: boolean, typeCheck?: boolean, build?: boolean, codegen?: boolean} = {},
): {
	readonly goal:    AST.Goal,
	readonly stmts:   NonNullable<typeof goal.block>['children'],
	readonly builder: Builder,
	readonly cg:      CodeGenerator,
	readonly mod:     CodeGenerator['mod'],
} {
	const goal: AST.Goal = AST.Goal.fromSource(source);
	const builder = new Builder();
	const cg      = new CodeGenerator();
	assert.ok(goal.block, 'Expected AST.Goal to contain a block.');
	opts.varCheck  ??= true;
	opts.typeCheck ??= true;
	opts.build     ??= true;
	opts.codegen   ??= true;
	opts.varCheck &&                                                 goal.varCheck();
	opts.varCheck && opts.typeCheck &&                               goal.typeCheck();
	opts.varCheck && opts.typeCheck && opts.build &&                 goal.build(builder);
	opts.varCheck && opts.typeCheck && opts.build && opts.codegen && builder.codegen(cg);
	return {
		goal,
		builder,
		cg,
		stmts: goal.block.children,
		mod:   cg.mod,
	};
}
