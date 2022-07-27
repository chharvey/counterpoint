import * as assert from 'assert';
import * as xjs from 'extrajs';
import {
	TYPE,
	SolidObject,
	SolidTuple,
	SolidRecord,
	SolidList,
	SolidDict,
	SolidSet,
	SolidMap,
	INST,
	Builder,
	TypeError05,
	TypeError06,
	CPConfig,
	CONFIG_DEFAULT,
	SyntaxNodeType,
} from './package.js';
import {
	ValidFunctionName,
	invalidFunctionName,
} from './utils-private.js';
import {ASTNodeCP} from './ASTNodeCP.js';
import type {ASTNodeType} from './ASTNodeType.js';
import {ASTNodeExpression} from './ASTNodeExpression.js';
import {ASTNodeVariable} from './ASTNodeVariable.js';



export class ASTNodeCall extends ASTNodeExpression {
	static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeCall {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert.ok(expression instanceof ASTNodeCall);
		return expression;
	}
	constructor (
		start_node: SyntaxNodeType<'expression_compound'>,
		readonly base: ASTNodeExpression,
		readonly typeargs: readonly ASTNodeType[],
		readonly exprargs: readonly ASTNodeExpression[],
	) {
		super(start_node, {}, [base, ...typeargs, ...exprargs]);
	}
	override varCheck(): void {
		// NOTE: ignore var-checking `this.base` for now, as we are using syntax to determine semantics.
		// (`this.base.source` must be a `ValidFunctionName`)
		return xjs.Array.forEachAggregated([
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
	protected override type_do(): TYPE.Type {
		if (!(this.base instanceof ASTNodeVariable)) {
			throw new TypeError05(this.base.type(), this.base);
		}
		return (new Map<ValidFunctionName, () => TYPE.Type>([
			[ValidFunctionName.LIST, () => {
				this.countArgs(1n, [0n, 2n]);
				const itemtype:   TYPE.Type = this.typeargs[0].eval();
				const returntype: TYPE.Type = new TYPE.SolidTypeList(itemtype);
				if (this.exprargs.length) {
					const argtype: TYPE.Type = this.exprargs[0].type();
					try {
						ASTNodeCP.typeCheckAssignment(returntype, argtype, this, this.validator);
					} catch (err) {
						const argitemtype: TYPE.Type = (
							(argtype instanceof TYPE.TypeUnit && argtype.value instanceof SolidTuple) ? argtype.value.toType().itemTypes() :
							(argtype instanceof TYPE.SolidTypeTuple)                                  ? argtype.itemTypes()                :
							(() => { throw err; })()
						);
						ASTNodeCP.typeCheckAssignment(itemtype, argitemtype, this, this.validator);
					}
				}
				return returntype.mutableOf();
			}],
			[ValidFunctionName.DICT, () => {
				this.countArgs(1n, [0n, 2n]);
				const valuetype:  TYPE.Type = this.typeargs[0].eval();
				const returntype: TYPE.Type = new TYPE.SolidTypeDict(valuetype);
				if (this.exprargs.length) {
					const argtype: TYPE.Type = this.exprargs[0].type();
					try {
						ASTNodeCP.typeCheckAssignment(returntype, argtype, this, this.validator);
					} catch (err) {
						const argvaluetype: TYPE.Type = (
							(argtype instanceof TYPE.TypeUnit && argtype.value instanceof SolidRecord) ? argtype.value.toType().valueTypes() :
							(argtype instanceof TYPE.SolidTypeRecord)                                  ? argtype.valueTypes()                :
							(() => { throw err; })()
						);
						ASTNodeCP.typeCheckAssignment(valuetype, argvaluetype, this, this.validator);
					}
				}
				return returntype.mutableOf();
			}],
			[ValidFunctionName.SET, () => {
				this.countArgs(1n, [0n, 2n]);
				const eltype:     TYPE.Type = this.typeargs[0].eval();
				const returntype: TYPE.Type = new TYPE.SolidTypeSet(eltype);
				if (this.exprargs.length) {
					const argtype: TYPE.Type = this.exprargs[0].type();
					try {
						ASTNodeCP.typeCheckAssignment(new TYPE.SolidTypeList(eltype), argtype, this, this.validator);
					} catch (err) {
						const argitemtype: TYPE.Type = (
							(argtype instanceof TYPE.TypeUnit && argtype.value instanceof SolidTuple) ? argtype.value.toType().itemTypes() :
							(argtype instanceof TYPE.SolidTypeTuple)                                  ? argtype.itemTypes()                :
							(() => { throw err; })()
						);
						ASTNodeCP.typeCheckAssignment(eltype, argitemtype, this, this.validator);
					}
				}
				return returntype.mutableOf();
			}],
			[ValidFunctionName.MAP, () => {
				this.countArgs([1n, 3n], [0n, 2n]);
				const anttype:    TYPE.Type = this.typeargs[0].eval();
				const contype:    TYPE.Type = this.typeargs[1]?.eval() || anttype;
				const returntype: TYPE.Type = new TYPE.SolidTypeMap(anttype, contype);
				const entrytype:  TYPE.Type = TYPE.SolidTypeTuple.fromTypes([anttype, contype]);
				if (this.exprargs.length) {
					const argtype: TYPE.Type = this.exprargs[0].type();
					try {
						ASTNodeCP.typeCheckAssignment(new TYPE.SolidTypeList(entrytype), argtype, this, this.validator);
					} catch (err) {
						const argitemtype: TYPE.Type = (
							(argtype instanceof TYPE.TypeUnit && argtype.value instanceof SolidTuple) ? argtype.value.toType().itemTypes() :
							(argtype instanceof TYPE.SolidTypeTuple)                                  ? argtype.itemTypes()                :
							(() => { throw err; })()
						);
						ASTNodeCP.typeCheckAssignment(entrytype, argitemtype, this, this.validator);
					}
				}
				return returntype.mutableOf();
			}],
		]).get(this.base.source as ValidFunctionName) || invalidFunctionName(this.base.source))();
	}
	protected override fold_do(): SolidObject | null {
		const argvalue: SolidObject | null | undefined = (this.exprargs.length) // TODO #fold should not return native `null` if it cannot assess
			? this.exprargs[0].fold()
			: undefined;
		if (argvalue === null) {
			return null;
		}
		return new Map<ValidFunctionName, (argument: SolidObject | undefined) => SolidObject | null>([
			[ValidFunctionName.LIST, (tuple)  => (tuple  === undefined) ? new SolidList() : new SolidList((tuple as SolidTuple).items)],
			[ValidFunctionName.DICT, (record) => (record === undefined) ? new SolidDict() : new SolidDict((record as SolidRecord).properties)],
			[ValidFunctionName.SET,  (tuple)  => (tuple  === undefined) ? new SolidSet()  : new SolidSet(new Set<SolidObject>((tuple as SolidTuple).items))],
			[ValidFunctionName.MAP,  (tuple)  => (tuple  === undefined) ? new SolidMap()  : new SolidMap(new Map<SolidObject, SolidObject>((tuple as SolidTuple).items.map((pair) => (pair as SolidTuple).items as [SolidObject, SolidObject])))],
		]).get(this.base.source as ValidFunctionName)!(argvalue);
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
