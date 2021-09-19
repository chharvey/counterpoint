import type {
	NonemptyArray,
} from '@chharvey/parser';
import * as assert from 'assert';
import {
	SolidType,
	SolidTypeTuple,
	SolidTypeList,
	SolidTypeHash,
	SolidTypeSet,
	SolidTypeMap,
	SolidObject,
	SolidTuple,
	SolidRecord,
	SolidList,
	SolidHash,
	SolidSet,
	SolidMap,
	INST,
	Builder,
	TypeError05,
	TypeError06,
	SolidConfig,
	CONFIG_DEFAULT,
	PARSENODE,
} from './package.js';
import type {Validator} from './Validator.js';
import {forEachAggregated} from './astnode/utilities.js';
import {
	ASTNodeType,
	ASTNodeTypeAlias,
	ASTNodeExpression,
	ASTNodeVariable,
} from './astnode/index.js';



export class ASTNodeTypeHash extends ASTNodeType {
	static override fromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ASTNodeTypeHash {
		const typ: ASTNodeType = ASTNodeType.fromSource(src, config);
		assert.ok(typ instanceof ASTNodeTypeHash);
		return typ;
	}
	constructor (
		start_node: PARSENODE.ParseNodeTypeHashLiteral,
		readonly type: ASTNodeType,
	) {
		super(start_node, {}, [type]);
	}
	protected override assess_do(validator: Validator): SolidType {
		return new SolidTypeHash(this.type.assess(validator));
	}
}
export class ASTNodeTypeSet extends ASTNodeType {
	static override fromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ASTNodeTypeSet {
		const typ: ASTNodeType = ASTNodeType.fromSource(src, config);
		assert.ok(typ instanceof ASTNodeTypeSet);
		return typ;
	}
	constructor (
		start_node: PARSENODE.ParseNodeTypeUnarySymbol,
		readonly type: ASTNodeType,
	) {
		super(start_node, {}, [type]);
	}
	protected override assess_do(validator: Validator): SolidType {
		return new SolidTypeSet(this.type.assess(validator));
	}
}
export class ASTNodeTypeMap extends ASTNodeType {
	static override fromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ASTNodeTypeMap {
		const typ: ASTNodeType = ASTNodeType.fromSource(src, config);
		assert.ok(typ instanceof ASTNodeTypeMap);
		return typ;
	}
	constructor (
		start_node: PARSENODE.ParseNodeTypeMapLiteral,
		readonly antecedenttype: ASTNodeType,
		readonly consequenttype: ASTNodeType,
	) {
		super(start_node, {}, [antecedenttype, consequenttype]);
	}
	protected override assess_do(validator: Validator): SolidType {
		return new SolidTypeMap(this.antecedenttype.assess(validator), this.consequenttype.assess(validator));
	}
}
export class ASTNodeTypeCall extends ASTNodeType {
	static override fromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ASTNodeTypeCall {
		const typ: ASTNodeType = ASTNodeType.fromSource(src, config);
		assert.ok(typ instanceof ASTNodeTypeCall);
		return typ;
	}
	constructor (
		start_node: PARSENODE.ParseNodeTypeCompound,
		readonly base: ASTNodeType,
		readonly args: Readonly<NonemptyArray<ASTNodeType>>,
	) {
		super(start_node, {}, [base, ...args]);
	}
	override varCheck(validator: Validator): void {
		// NOTE: ignore var-checking `this.base` for now, as we are using syntax to determine semantics.
		// (`this.base.source` must be `List | Hash | Set | Map`)
		return forEachAggregated(this.args, (arg) => arg.varCheck(validator));
	}
	protected override assess_do(validator: Validator): SolidType {
		if (!(this.base instanceof ASTNodeTypeAlias)) {
			throw new TypeError05(this.base.assess(validator), this.base);
		}
		return (new Map<string, () => SolidType>([
			['List', () => (this.countArgs(1n), new SolidTypeList(this.args[0].assess(validator)))],
			['Hash', () => (this.countArgs(1n), new SolidTypeHash(this.args[0].assess(validator)))],
			['Set',  () => (this.countArgs(1n), new SolidTypeSet (this.args[0].assess(validator)))],
			['Map',  () => {
				this.countArgs([1n, 3n]);
				const anttype: SolidType = this.args[0].assess(validator);
				const contype: SolidType = this.args[1]?.assess(validator) || anttype;
				return new SolidTypeMap(anttype, contype);
			}],
		]).get(this.base.source) || (() => {
			throw new SyntaxError(`Unexpected token: ${ this.base.source }; expected \`List | Hash | Set | Map\`.`);
		}))();
	}
	/**
	 * Count this call’s number of actual arguments and compare it to the number of expected arguments,
	 * and throw if the number is incorrect.
	 * The given argument may be a single value or a 2-tuple of values representing a range.
	 * If a 2-tuple, the first item represents the minimum (inclusive),
	 * and the second item represents the maximum (exclusive).
	 * E.g., `countArgs([2n, 5n])` expects 2, 3, or 4 arguments, but not 5.
	 * @param expected - the number of expected arguments, or a half-open range
	 * @throws if this call’s number of actual arguments does not satisfy the expected number
	 */
	private countArgs(expected: bigint | [bigint, bigint]): void {
		const actual: bigint = BigInt(this.args.length);
		if (typeof expected === 'bigint') {
			expected = [expected, expected + 1n];
		}
		if (actual < expected[0]) {
			throw new TypeError06(actual, expected[0], true, this);
		}
		if (expected[1] <= actual) {
			throw new TypeError06(actual, expected[1] - 1n, true, this);
		}
	}
}
export class ASTNodeCall extends ASTNodeExpression {
	static override fromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ASTNodeCall {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert.ok(expression instanceof ASTNodeCall);
		return expression;
	}
	constructor (
		start_node: PARSENODE.ParseNodeExpressionCompound,
		readonly base: ASTNodeExpression,
		readonly typeargs: readonly ASTNodeType[],
		readonly exprargs: readonly ASTNodeExpression[],
	) {
		super(start_node, {}, [base, ...typeargs, ...exprargs]);
	}
	override varCheck(validator: Validator): void {
		// NOTE: ignore var-checking `this.base` for now, as we are using syntax to determine semantics.
		// (`this.base.source` must be `List | Hash | Set | Map`)
		return forEachAggregated([
			...this.typeargs,
			...this.exprargs,
		], (arg) => arg.varCheck(validator));
	}
	override shouldFloat(_validator: Validator): boolean {
		return false;
	}
	protected override build_do(builder: Builder, to_float: boolean = false): INST.InstructionUnop {
		throw builder && to_float && '`ASTNodeCall#build_do` not yet supported.'
	}
	protected override type_do(validator: Validator): SolidType {
		if (!(this.base instanceof ASTNodeVariable)) {
			throw new TypeError05(this.base.type(validator), this.base);
		}
		return (new Map<string, () => SolidType>([
			['List', () => {
				this.countArgs(1n, [0n, 2n]);
				const returntype: SolidType = new SolidTypeList(this.typeargs[0].assess(validator));
				this.exprargs.length && this.typeCheckAssignment(returntype, this.exprargs[0].type(validator), validator);
				return returntype;
			}],
			['Hash', () => {
				this.countArgs(1n, [0n, 2n]);
				const returntype: SolidType = new SolidTypeHash(this.typeargs[0].assess(validator));
				this.exprargs.length && this.typeCheckAssignment(returntype, this.exprargs[0].type(validator), validator);
				return returntype;
			}],
			['Set', () => {
				this.countArgs(1n, [0n, 2n]);
				const eltype:     SolidType = this.typeargs[0].assess(validator);
				const returntype: SolidType = new SolidTypeSet(eltype);
				this.exprargs.length && this.typeCheckAssignment(new SolidTypeList(eltype), this.exprargs[0].type(validator), validator);
				return returntype;
			}],
			['Map', () => {
				this.countArgs([1n, 3n], [0n, 2n]);
				const anttype:    SolidType = this.typeargs[0].assess(validator);
				const contype:    SolidType = this.typeargs[1]?.assess(validator) || anttype;
				const returntype: SolidType = new SolidTypeMap(anttype, contype);
				this.exprargs.length && this.typeCheckAssignment(new SolidTypeList(SolidTypeTuple.fromTypes([anttype, contype])), this.exprargs[0].type(validator), validator);
				return returntype;
			}],
		]).get(this.base.source) || (() => {
			throw new SyntaxError(`Unexpected token: ${ this.base.source }; expected \`List | Hash | Set | Map\`.`);
		}))();
	}
	protected override assess_do(validator: Validator): SolidObject | null {
		const argvalue: SolidObject | null | undefined = (this.exprargs.length) // TODO #assess should not return native `null` if it cannot assess
			? this.exprargs[0].assess(validator)
			: undefined;
		if (argvalue === null) {
			return null;
		}
		return new Map<string, (argument: SolidObject | undefined) => SolidObject | null>([
			['List', (tuple)  => (tuple === undefined)  ? new SolidList() : new SolidList((tuple as SolidTuple).items)],
			['Hash', (record) => (record === undefined) ? new SolidHash() : new SolidHash((record as SolidRecord).properties)],
			['Set',  (tuple)  => (tuple === undefined)  ? new SolidSet()  : new SolidSet(new Set<SolidObject>((tuple as SolidTuple).items))],
			['Map',  (tuple)  => (tuple === undefined)  ? new SolidMap()  : new SolidMap(new Map<SolidObject, SolidObject>((tuple as SolidTuple).items.map((pair) => (pair as SolidTuple).items as [SolidObject, SolidObject])))],
		]).get(this.base.source)!(argvalue);
	}
	/**
	 * Count this call’s number of actual arguments and compare it to the number of expected arguments,
	 * and throw if the number is incorrect.
	 * Each given argument may be a single value or a 2-tuple of values representing a range.
	 * If a 2-tuple, the first item represents the minimum (inclusive),
	 * and the second item represents the maximum (exclusive).
	 * E.g., `countArgs([2n, 5n])` expects 2, 3, or 4 arguments, but not 5.
	 * @param expected_generic  - the number of expected generic arguments, or a half-open range
	 * @param expected_function - the number of expected function arguments, or a half-open range
	 * @throws if this call’s number of actual arguments does not satisfy the expected number
	 */
	private countArgs(expected_generic: bigint | [bigint, bigint], expected_function: bigint | [bigint, bigint]): void {
		const actual_generic:  bigint = BigInt(this.typeargs.length);
		const actual_function: bigint = BigInt(this.exprargs.length);
		if (typeof expected_generic === 'bigint') {
			expected_generic = [expected_generic, expected_generic + 1n];
		}
		if (typeof expected_function === 'bigint') {
			expected_function = [expected_function, expected_function + 1n];
		}
		if (actual_generic < expected_generic[0]) {
			throw new TypeError06(actual_generic, expected_generic[0], true, this);
		}
		if (expected_generic[1] <= actual_generic) {
			throw new TypeError06(actual_generic, expected_generic[1] - 1n, true, this);
		}
		if (actual_function < expected_function[0]) {
			throw new TypeError06(actual_function, expected_function[0], false, this);
		}
		if (expected_function[1] <= actual_function) {
			throw new TypeError06(actual_function, expected_function[1] - 1n, false, this);
		}
	}
}
