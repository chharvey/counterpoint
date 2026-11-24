import * as assert from 'node:assert';
import * as binaryen from 'binaryen.ts';
import * as xjs from 'extrajs';
import {
	type ConstructorType,
	assert_instanceof,
	Validator,
	AST,
	VALUE,
	TYPE,
	Builder,
	OP,
	CodeGenerator,
} from '../src/index.ts';



export const FUNC_CALLS = `{
	val list: mut List.<int>     = [1000, 2000, 3000];
	val dict: mut Dict.<int>     = [a= 1, b= 2, c= 3];
	val sett: mut Set.<int>      = {1000, 2000, 3000};
	val map:  mut Map.<str, int> = {"a" -> 1, "b" -> 2, "c" -> 3};

	'List#get'.<int>(list, 0);      %== Some[int](1000)
	'List#get'.<int>(list, 3);      %== None[int]()
	'Dict#get'.<int>(dict, @a);     %== Some[int](1)
	'Dict#get'.<int>(dict, @d);     %== None[int]()
	'Set#has'.<int>(sett, 3000);    %== true
	'Set#has'.<int>(sett, 4000);    %== false
	'Set#has'.<int>(sett, 4.44);    %== false
	'Map#get'.<str, int>(map, "a"); %== Some[int](1)
	'Map#get'.<str, int>(map, "d"); %== None[int]()
	'Map#get'.<str, int>(map, @a);  %== None[int]()

	'List#set'.<int>(list, 0, 4000);   % void
	'List#set'.<int>(list, 3, 5000);   % void
	'Dict#set'.<int>(dict, @a, 4);     % void
	'Dict#set'.<int>(dict, @d, 5);     % void
	'Set#put'.<int>(sett, 4000);       % void
	'Set#delete'.<int>(sett, 1000);    % void
	'Set#delete'.<int>(sett, 4.44);    % void
	'Map#set'.<str, int>(map, "a", 4); % void
	'Map#set'.<str, int>(map, "d", 5); % void

	list; %== [4000, 2000, 3000, 5000]
	dict; %== [a= 4, b= 2, c= 3, d= 5]
	sett; %== {2000, 3000, 4000}
	map;  %== {"a" -> 4, "b" -> 2, "c" -> 3, "d" -> 5};
}`;



/**
 * List of example constructor calls for testing.
 *
 * Use `Array#filter` in combination with string/regex methods to select specific examples.
 */
export const CTOR_CALLS: readonly string[] = [
	'Boolean.(null)',
	'Boolean.(false)',
	'Boolean.(true)',
	'Boolean.(@hello)',
	'Boolean.(-0)',
	'Boolean.(-42)',
	'Boolean.(+0)',
	'Boolean.(+42)',
	'Boolean.(0.0)',
	'Boolean.(4.2)',
	'Boolean.("hello")',

	'Integer.(-42)',
	'Integer.(+42)',
	'Integer.(4.2)',

	'Natural.(-42)',
	'Natural.(+42)',
	'Natural.(4.2)',

	'Float.(-42)',
	'Float.(+42)',
	'Float.(4.2)',

	'String.(null)',
	'String.(true)',
	'String.(-42)',
	'String.(+42)',
	'String.(4.2)',
	'String.("hello")',
	'String.(())',
	'String.((a= 1))',
	'String.([])',
	'String.([a= 1])',
	'String.({})',
	'String.({"a" -> 1})',

	'List.<int>()',
	'List.<int>(())',
	'List.<int>(List.<int>())',
	'List.<int>([])',
	'List.<int>(Set.<int>())',
	'List.<int>({})',
	'List.<int>((1, 2, 3))',
	'List.<int>(List.<int>((1, 2, 3)))',
	'List.<int>([1, 2, 3])',
	'List.<int>(Set.<int>((1, 2, 3)))',
	'List.<int>({1, 2, 3})',

	'Dict.<int>()',
	'Dict.<int>(())',
	// 'Dict.<int>((=))', // empty record is impossible
	'Dict.<int>(List.<(sym, int)>())',
	'Dict.<int>([])',
	'Dict.<int>(Dict.<int>())',
	// 'Dict.<int>([=])', // empty dict literal is impossible
	'Dict.<int>(Set.<(sym, int)>())',
	'Dict.<int>({})',
	'Dict.<int>(Map.<sym, int>())',
	// 'Dict.<int>({->})', // empty map literal is impossible
	`Dict.<int>((
		(@a, 1),
		(@b, 2),
		(@c, 3),
	))`,
	'Dict.<int>((a= 1, b= 2, c= 3))',
	`Dict.<int>(List.<(sym, int)>((
		(@a, 1),
		(@b, 2),
		(@c, 3),
	)))`,
	`Dict.<int>([
		(@a, 1),
		(@b, 2),
		(@c, 3),
	])`,
	'Dict.<int>(Dict.<int>((a= 1, b= 2, c= 3)))',
	'Dict.<int>([a= 1, b= 2, c= 3])',
	`Dict.<int>(Set.<(sym, int)>((
		(@a, 1),
		(@b, 2),
		(@c, 3),
	)))`,
	`Dict.<int>({
		(@a, 1),
		(@b, 2),
		(@c, 3),
	})`,
	`Dict.<int>(Map.<sym, int>((
		(@a, 1),
		(@b, 2),
		(@c, 3),
	)))`,
	`Dict.<int>({
		@a -> 1,
		@b -> 2,
		@c -> 3,
	})`,

	'Set.<int>()',
	'Set.<int>(())',
	'Set.<int>(List.<int>())',
	'Set.<int>([])',
	'Set.<int>(Set.<int>())',
	'Set.<int>({})',
	'Set.<int>((1, 2, 3))',
	'Set.<int>(List.<int>((1, 2, 3)))',
	'Set.<int>([1, 2, 3])',
	'Set.<int>(Set.<int>((1, 2, 3)))',
	'Set.<int>({1, 2, 3})',

	'Map.<int, float>()',
	'Map.<int, float>(())',
	'Map.<int, float>(List.<(int, float)>())',
	'Map.<int, float>([])',
	'Map.<int, float>(Set.<(int, float)>())',
	'Map.<int, float>({})',
	'Map.<int, float>(Map.<int, float>())',
	// 'Map.<int, float>({->})', // empty map literal is impossible
	`Map.<int, float>((
		(1, 0.1),
		(2, 0.2),
		(3, 0.4),
	))`,
	`Map.<int, float>(List.<(int, float)>((
		(1, 0.1),
		(2, 0.2),
		(3, 0.4),
	)))`,
	`Map.<int, float>([
		(1, 0.1),
		(2, 0.2),
		(3, 0.4),
	])`,
	`Map.<int, float>(Set.<(int, float)>((
		(1, 0.1),
		(2, 0.2),
		(3, 0.4),
	)))`,
	`Map.<int, float>({
		(1, 0.1),
		(2, 0.2),
		(3, 0.4),
	})`,
	`Map.<int, float>(Map.<int, float>((
		(1, 0.1),
		(2, 0.2),
		(3, 0.4),
	)))`,
	`Map.<int, float>({
		1 -> 0.1,
		2 -> 0.2,
		3 -> 0.4,
	})`,

	'Exception.("message")',
	'Exception.("message", Exception.("cause"))',

	'None.<int>()',

	'Some.<int>(42)',

	'Fail.<int>(Exception.("message"))',

	'Ok.<int>(42)',
];



export function extract_tokens(template: string): string[] {
	return template.trim().replace(/\n\t+/g, '  ').split('  ');
}

export function extract_lines(strings: TemplateStringsArray, ...interps: unknown[]): string[] {
	return String.raw({raw: strings}, ...interps).split('\n').map((line) => line.trim()).filter((line) => !!line);
}

export function repeat<T>(value: T, times: number): T[] {
	return new Array<T>(times).fill(value);
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
	| {cause:  ValidationObject}
);
export function assertAssignable(actual: Error, validation: ValidationObject): void {
	assert_instanceof(actual, validation.cons);
	if ('message' in validation) {
		return assert.strictEqual(actual.message, validation.message);
	} else if ('errors' in validation) {
		assert.ok(
			validation.cons === AggregateError || validation.cons.prototype instanceof AggregateError, // validation.cons extends AggregateError
			`The \`cons\` value of validation object ${validation.cons} with an \`errors\` property must be \`AggregateError\` or a subclass of it.`,
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



type NullishType = TYPE.Type | null;
/**
 * Assert equal types. First compares by `assert.deepStrictEqual`,
 * but if that fails, compares by `Type#equals`.
 * @param actual   the actual type
 * @param expected what `actual` is expected to equal
 * @throws {AssertionError} actual and expected fail equality
 */
export function assertEqualTypes(actual: NullishType, expected: NullishType): void;
/**
 * Assert equal types. First compares by `assert.deepStrictEqual`,
 * but if that fails, compares by `Type#equals`.
 * @param actual   an array of actual types
 * @param expected an array of what `actual` is expected to equal
 * @throws {AssertionError} if a corresponding type fails equality
 */
export function assertEqualTypes(actual: readonly NullishType[], expected: readonly NullishType[]): void;
/**
 * Assert equal types. First compares by `assert.deepStrictEqual`,
 * but if that fails, compares by `Type#equals`.
 * @param types a map of keys and values to compare
 * @throws {AssertionError} if one of the pairs fails equality
 */
export function assertEqualTypes(types: ReadonlyMap<NullishType, NullishType>): void;
export function assertEqualTypes(
	arg0:  NullishType | readonly NullishType[] | ReadonlyMap<NullishType, NullishType>,
	arg1?: NullishType | readonly NullishType[],
): void {
	if (arg0 instanceof Map) {
		return assertEqualTypes([...arg0.keys()], [...arg0.values()]);
	} else if (Array.isArray(arg0)) {
		assert.strictEqual(arg0.length, (arg1 as readonly NullishType[]).length, 'Expected arrays to have the same length.');
		return xjs.Array.forEachAggregated(arg0, (act, i) => assertEqualTypes(act as NullishType, (arg1 as readonly NullishType[])[i]));
	} else if (arg1 === null) {
		return assert.strictEqual(arg0, null);
	} else if ((TYPE.TYPE_CONSTANTS as readonly NullishType[]).includes(arg1 as NullishType)) {
		return assert.strictEqual(arg0, arg1);
	} else {
		try {
			return assert.deepStrictEqual(arg0, arg1);
		} catch {
			return assert.ok(arg0 && arg1 && (arg0 as TYPE.Type).equals(arg1 as TYPE.Type), `${arg0 as TYPE.Type} == ${arg1}`);
		}
	}
}

/**
 * Assert equal interpreter values.
 * but if that fails, compares by `Value#equal` (Counterpoint equality).
 * @param actual   the actual value
 * @param expected what `actual` is expected to equal
 * @throws {AssertionError} actual and expected fail equality
 */
export function assert_equal_values(actual: VALUE.Value, expected: VALUE.Value): void;
/**
 * Assert equal interpreter values.
 * but if that fails, compares by `Value#equal` (Counterpoint equality).
 * @param actual   an array of actual values
 * @param expected an array of what `actual` is expected to equal
 * @throws {AssertionError} if a corresponding type fails equality
 */
export function assert_equal_values(actual: readonly VALUE.Value[], expected: readonly VALUE.Value[]): void;
/**
 * Assert equal interpreter values.
 * but if that fails, compares by `Value#equal` (Counterpoint equality).
 * @param types a map of keys and values to compare
 * @throws {AssertionError} if one of the pairs fails equality
 */
export function assert_equal_values(types: ReadonlyMap<VALUE.Value, VALUE.Value>): void;
export function assert_equal_values(arg0: VALUE.Value | readonly VALUE.Value[] | ReadonlyMap<VALUE.Value, VALUE.Value>, arg1?: VALUE.Value | readonly VALUE.Value[]): void {
	if (arg0 instanceof Map) {
		return assert_equal_values([...arg0.keys()], [...arg0.values()]);
	} else if (Array.isArray(arg0)) {
		assert.strictEqual(arg0.length, (arg1 as VALUE.Value[]).length, 'Expected arrays to have the same length.');
		return xjs.Array.forEachAggregated(arg0, (act, i) => assert_equal_values(act as VALUE.Value, (arg1 as VALUE.Value[])[i]));
	} else {
		return assert.ok((arg0 as VALUE.Value).equal(arg1 as VALUE.Value), `${arg0 as VALUE.Value} == ${arg1}`);
	}
}

export function assertEqualBins<Ref extends binaryen.ExpressionRef>(actual: Ref, expected: Ref, message?: Parameters<typeof assert.strictEqual>[2]): void;
export function assertEqualBins<Ref extends binaryen.ExpressionRef>(actual: readonly Ref[], expected: readonly Ref[]): void;
export function assertEqualBins<Ref extends binaryen.ExpressionRef>(bins: ReadonlyMap<Ref, Ref>): void;
export function assertEqualBins<Ref extends binaryen.ExpressionRef>(arg0: Ref | readonly Ref[] | ReadonlyMap<Ref, Ref>, arg1?: Ref | readonly Ref[], message?: Parameters<typeof assert.strictEqual>[2]): void {
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
const TYPE_UNIT_MEMO_SYM = new Map<string, TYPE.Unit<VALUE.Symbol>>();
const TYPE_UNIT_MEMO_NAT = new Map<bigint, TYPE.Unit<VALUE.Natural>>();
export function typeUnit(value: symbol, name?: string): TYPE.Unit<VALUE.Symbol>;
export function typeUnit(value: bigint): TYPE.Unit<VALUE.Integer>;
export function typeUnit(value: bigint, tag: 'nat'): TYPE.Unit<VALUE.Natural>;
export function typeUnit(value: number): TYPE.Unit<VALUE.Float>;
export function typeUnit(value: string, tag?: 'sym'): TYPE.Unit<VALUE.String>;
export function typeUnit(value: symbol | bigint | number | string, tag?: string): TYPE.Unit<VALUE.Symbol | VALUE.Integer | VALUE.Natural | VALUE.Float | VALUE.String> {
	if (typeof value === 'string' && tag === 'sym') {
		// TODO: Map#getOrInsertComputed
		TYPE_UNIT_MEMO_SYM.has(value) || TYPE_UNIT_MEMO_SYM.set(value, new VALUE.Symbol(Validator.keyId(value), value).toType());
		return TYPE_UNIT_MEMO_SYM.get(value)!;
	}
	if (typeof value === 'bigint' && tag === 'nat') {
		// TODO: Map#getOrInsertComputed
		TYPE_UNIT_MEMO_NAT.has(value) || TYPE_UNIT_MEMO_NAT.set(value, (
			value === 0n ? VALUE.NAT_0 :
			value === 1n ? VALUE.NAT_1 :
			new VALUE.Natural(value)
		).toType());
		return TYPE_UNIT_MEMO_NAT.get(value)!;
	}
	// TODO: Map#getOrInsertComputed
	TYPE_UNIT_MEMO.has(value) || TYPE_UNIT_MEMO.set(value, (
		value === 0n              ? VALUE.INT_0 :
		value === 1n              ? VALUE.INT_1 :
		typeof value === 'symbol' ? new VALUE.Symbol(BigInt(value.description ?? ''), tag ?? '') :
		typeof value === 'bigint' ? new VALUE.Integer(value) :
		typeof value === 'number' ? new VALUE.Float(value) :
		typeof value === 'string' ? new VALUE.String(value) :
		assert.fail(new TypeError(`Did not expect type ${typeof value}.`))
	).toType());
	return TYPE_UNIT_MEMO.get(value)!;
}

export function genConst(cg: CodeGenerator, value: symbol, name?: string): binaryen.ExpressionRef;
export function genConst(cg: CodeGenerator, value: string, tag?: 'sym'): binaryen.ExpressionRef;
export function genConst(cg: CodeGenerator, value: bigint, tag?: 'nat'): binaryen.ExpressionRef;
export function genConst(cg: CodeGenerator, value?: null | boolean | number | string): binaryen.ExpressionRef;
export function genConst(cg: CodeGenerator, value: null | boolean | symbol | bigint | number | string = null, tag?: string): binaryen.ExpressionRef {
	switch (value) {
		case null:  { return cg.vm.Value.NULL; }
		case false: { return cg.vm.Value.FALSE; }
		case true:  { return cg.vm.Value.TRUE; }
	}
	if (typeof value === 'string' && tag === 'sym') {
		return new VALUE.Symbol(Validator.keyId(value), value).codegen(cg);
	}
	if (typeof value === 'bigint' && tag === 'nat') {
		return (
			value === 0n ? VALUE.NAT_0 :
			value === 1n ? VALUE.NAT_1 :
			new VALUE.Natural(value)
		).codegen(cg);
	}
	return (
		value === 0n              ? VALUE.INT_0 :
		value === 1n              ? VALUE.INT_1 :
		typeof value === 'symbol' ? new VALUE.Symbol(BigInt(value.description ?? ''), tag ?? '') :
		typeof value === 'bigint' ? new VALUE.Integer(value) :
		typeof value === 'number' ? new VALUE.Float(value) :
		typeof value === 'string' ? new VALUE.String(value) :
		assert.fail(new TypeError(`Did not expect type ${typeof value}.`))
	).codegen(cg);
}



/**
 * Generate an {@link AST.Goal} containing a Counterpoint script and run checks on it,
 * then return various aspects of the node.
 * @param source         the source text of the Counterpoint script
 * @param opts           various options for compiling
 * @param opts.refCheck  Should the RefCheck  algorithm be performed? (defaults true)
 * @param opts.typeCheck Should the TypeCheck algorithm be performed? (defaults true) (only done if `refCheck` is true)
 * @param opts.build     Should the Build     algorithm be performed? (defaults true) (only done if `refCheck` and `typeCheck` are true)
 * @param opts.codegen   Should the Codegen   algorithm be performed? (defaults true) (only done if `refCheck`, `typeCheck`, and `lower` are true)
 * @return               the `Goal` instance and some properties of it
 */
export function setupScript(
	source: string,
	opts:   {refCheck?: boolean, typeCheck?: boolean, build?: boolean, codegen?: boolean} = {},
): {
	readonly goal:    AST.Goal,
	readonly stmts:   AST.Block['children'],
	readonly builder: Builder,
	readonly cg:      CodeGenerator,
	readonly wasm:    binaryen.ExpressionBuilder,

	readonly visitors: {
		readonly refCheck:  AST.AstNodeVisitorRefCheck,
		readonly typeCheck: AST.AstNodeVisitorTypeCheck,

		readonly build: {
			readonly node: AST.AstNodeVisitorBuild,
			readonly expr: AST.ExprVisitorBuild,
		},
		readonly codegen: {
			readonly value: OP.ValueVisitorCodegen,
			readonly instr: OP.InstrVisitorCodegen,
		},
	},
} {
	const goal: AST.Goal     = AST.Goal.fromSource(source);
	const builder            = new Builder();
	const cg                 = new CodeGenerator();
	const visitor_ref_check  = new AST.AstNodeVisitorRefCheck();
	const visitor_type_check = new AST.AstNodeVisitorTypeCheck();
	const visitor_build      = new AST.AstNodeVisitorBuild(builder);
	assert.ok(goal.block, 'Expected AST.Goal to contain a block.');
	opts.refCheck  ??= true;
	opts.typeCheck ??= true;
	opts.build     ??= true;
	opts.codegen   ??= true;
	opts.refCheck &&                                                 visitor_ref_check.visit(goal);
	opts.refCheck && opts.typeCheck &&                               visitor_type_check.visit(goal);
	opts.refCheck && opts.typeCheck && opts.build &&                 visitor_build.visit(goal);
	opts.refCheck && opts.typeCheck && opts.build && opts.codegen && builder.codegen(cg);
	return {
		goal,
		builder,
		cg,
		stmts: goal.block.children,
		wasm:  cg.mod.wasm,

		visitors: {
			refCheck:  visitor_ref_check,
			typeCheck: visitor_type_check,

			build: {
				node: visitor_build,
				expr: new AST.ExprVisitorBuild(builder),
			},
			codegen: {
				value: new OP.ValueVisitorCodegen(cg),
				instr: new OP.InstrVisitorCodegen(cg),
			},
		},
	};
}
