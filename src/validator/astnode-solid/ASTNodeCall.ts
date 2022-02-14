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
	forEachAggregated,
	SolidConfig,
	CONFIG_DEFAULT,
	SyntaxNodeFamily,
} from './package.js';
import {ASTNodeSolid} from './ASTNodeSolid.js';
import type {ASTNodeType} from './ASTNodeType.js';
import {ASTNodeExpression} from './ASTNodeExpression.js';
import {ASTNodeVariable} from './ASTNodeVariable.js';



export class ASTNodeCall extends ASTNodeExpression {
	static override fromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ASTNodeCall {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert.ok(expression instanceof ASTNodeCall);
		return expression;
	}
	constructor (
		start_node: SyntaxNodeFamily<'expression_compound', ['variable']>,
		readonly base: ASTNodeExpression,
		readonly typeargs: readonly ASTNodeType[],
		readonly exprargs: readonly ASTNodeExpression[],
	) {
		super(start_node, {}, [base, ...typeargs, ...exprargs]);
	}
	override varCheck(): void {
		// NOTE: ignore var-checking `this.base` for now, as we are using syntax to determine semantics.
		// (`this.base.source` must be `List | Hash | Set | Map`)
		return forEachAggregated([
			...this.typeargs,
			...this.exprargs,
		], (arg) => arg.varCheck());
	}
	override shouldFloat(): boolean {
		return false;
	}
	protected override build_do(builder: Builder, to_float: boolean = false): INST.InstructionUnop {
		throw builder && to_float && '`ASTNodeCall#build_do` not yet supported.'
	}
	protected override type_do(): SolidType {
		if (!(this.base instanceof ASTNodeVariable)) {
			throw new TypeError05(this.base.type(), this.base);
		}
		return (new Map<string, () => SolidType>([
			['List', () => {
				this.countArgs(1n, [0n, 2n]);
				const returntype: SolidType = new SolidTypeList(this.typeargs[0].eval());
				this.exprargs.length && ASTNodeSolid.typeCheckAssignment(
					returntype,
					this.exprargs[0],
					this,
					this.validator,
				);
				return returntype.mutableOf();
			}],
			['Hash', () => {
				this.countArgs(1n, [0n, 2n]);
				const returntype: SolidType = new SolidTypeHash(this.typeargs[0].eval());
				this.exprargs.length && ASTNodeSolid.typeCheckAssignment(
					returntype,
					this.exprargs[0],
					this,
					this.validator,
				);
				return returntype.mutableOf();
			}],
			['Set', () => {
				this.countArgs(1n, [0n, 2n]);
				const eltype:     SolidType = this.typeargs[0].eval();
				const returntype: SolidType = new SolidTypeSet(eltype);
				this.exprargs.length && ASTNodeSolid.typeCheckAssignment(
					new SolidTypeList(eltype),
					this.exprargs[0],
					this,
					this.validator,
				);
				return returntype.mutableOf();
			}],
			['Map', () => {
				this.countArgs([1n, 3n], [0n, 2n]);
				const anttype:    SolidType = this.typeargs[0].eval();
				const contype:    SolidType = this.typeargs[1]?.eval() || anttype;
				const returntype: SolidType = new SolidTypeMap(anttype, contype);
				this.exprargs.length && ASTNodeSolid.typeCheckAssignment(
					new SolidTypeList(SolidTypeTuple.fromTypes([anttype, contype])),
					this.exprargs[0],
					this,
					this.validator,
				);
				return returntype.mutableOf();
			}],
		]).get(this.base.source) || (() => {
			throw new SyntaxError(`Unexpected token: ${ this.base.source }; expected \`List | Hash | Set | Map\`.`);
		}))();
	}
	protected override fold_do(): SolidObject | null {
		const argvalue: SolidObject | null | undefined = (this.exprargs.length) // TODO #fold should not return native `null` if it cannot assess
			? this.exprargs[0].fold()
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
