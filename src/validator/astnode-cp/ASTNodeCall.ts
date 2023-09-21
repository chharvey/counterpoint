import type binaryen from 'binaryen';
import * as xjs from 'extrajs';
import {
	OBJ,
	TYPE,
	type Builder,
	type TypeErrorNotAssignable,
	TypeErrorNotCallable,
	TypeErrorArgCount,
} from '../../index.js';
import {
	throw_expression,
	assert_instanceof,
	memoizeMethod,
} from '../../lib/index.js';
import {
	type CPConfig,
	CONFIG_DEFAULT,
} from '../../core/index.js';
import type {SyntaxNodeType} from '../utils-private.js';
import {
	type ArgCount,
	ValidFunctionName,
	invalid_function_name,
} from './utils-private.js';
import {ASTNodeCP} from './ASTNodeCP.js';
import type {ASTNodeType} from './ASTNodeType.js';
import {ASTNodeExpression} from './ASTNodeExpression.js';
import {ASTNodeVariable} from './ASTNodeVariable.js';



export class ASTNodeCall extends ASTNodeExpression {
	public static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeCall {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert_instanceof(expression, ASTNodeCall);
		return expression;
	}

	public constructor(
		start_node: SyntaxNodeType<'expression_compound'>,
		private readonly base: ASTNodeExpression,
		private readonly typeargs: readonly ASTNodeType[],
		private readonly exprargs: readonly ASTNodeExpression[],
	) {
		super(start_node, {}, [base, ...typeargs, ...exprargs]);
	}

	public override varCheck(): void {
		// NOTE: ignore var-checking `this.base` for now, as semantics is determined by syntax.
		// (`this.base.source` must be a `ValidFunctionName`)
		return xjs.Array.forEachAggregated([
			...this.typeargs,
			...this.exprargs,
		], (arg) => arg.varCheck());
	}

	@memoizeMethod
	@ASTNodeExpression.buildDeco
	public override build(builder: Builder): binaryen.ExpressionRef {
		builder;
		throw '`ASTNodeCall#build` not yet supported.';
	}

	@memoizeMethod
	@ASTNodeExpression.typeDeco
	public override type(): TYPE.Type {
		if (!(this.base instanceof ASTNodeVariable)) {
			throw new TypeErrorNotCallable(this.base.type(), this.base);
		}
		return (new Map<ValidFunctionName, () => TYPE.Type>([
			[ValidFunctionName.LIST, () => {
				this.countArgs(1n, [0n, 2n]);
				const itemtype:   TYPE.Type = this.typeargs[0].eval();
				const returntype            = new TYPE.TypeList(itemtype);
				if (this.exprargs.length) {
					const argtype: TYPE.Type = this.exprargs[0].type();
					try {
						ASTNodeCP.typeCheckAssignment(argtype, returntype, this);
					} catch (err) {
						const argitemtype: TYPE.Type = (argtype instanceof TYPE.TypeTuple) ? argtype.itemTypes() : throw_expression(err as TypeErrorNotAssignable);
						ASTNodeCP.typeCheckAssignment(argitemtype, itemtype, this);
					}
				}
				return returntype.mutableOf();
			}],
			[ValidFunctionName.DICT, () => {
				this.countArgs(1n, [0n, 2n]);
				const valuetype:  TYPE.Type = this.typeargs[0].eval();
				const returntype            = new TYPE.TypeDict(valuetype);
				if (this.exprargs.length) {
					const argtype: TYPE.Type = this.exprargs[0].type();
					try {
						ASTNodeCP.typeCheckAssignment(argtype, returntype, this);
					} catch (err) {
						const argvaluetype: TYPE.Type = (argtype instanceof TYPE.TypeRecord) ? argtype.valueTypes() : throw_expression(err as TypeErrorNotAssignable);
						ASTNodeCP.typeCheckAssignment(argvaluetype, valuetype, this);
					}
				}
				return returntype.mutableOf();
			}],
			[ValidFunctionName.SET, () => {
				this.countArgs(1n, [0n, 2n]);
				const eltype:     TYPE.Type = this.typeargs[0].eval();
				const returntype            = new TYPE.TypeSet(eltype);
				if (this.exprargs.length) {
					const argtype: TYPE.Type = this.exprargs[0].type();
					try {
						ASTNodeCP.typeCheckAssignment(argtype, new TYPE.TypeList(eltype), this);
					} catch (err) {
						const argitemtype: TYPE.Type = (argtype instanceof TYPE.TypeTuple) ? argtype.itemTypes() : throw_expression(err as TypeErrorNotAssignable);
						ASTNodeCP.typeCheckAssignment(argitemtype, eltype, this);
					}
				}
				return returntype.mutableOf();
			}],
			[ValidFunctionName.MAP, () => {
				this.countArgs([1n, 3n], [0n, 2n]);
				const anttype:    TYPE.Type      = this.typeargs[0].eval();
				const contype:    TYPE.Type      = this.typeargs[1]?.eval() ?? anttype;
				const returntype                 = new TYPE.TypeMap(anttype, contype);
				const entrytype:  TYPE.TypeTuple = TYPE.TypeTuple.fromTypes([anttype, contype]);
				if (this.exprargs.length) {
					const argtype: TYPE.Type = this.exprargs[0].type();
					try {
						ASTNodeCP.typeCheckAssignment(argtype, new TYPE.TypeList(entrytype), this);
					} catch (err) {
						const argitemtype: TYPE.Type = (argtype instanceof TYPE.TypeTuple) ? argtype.itemTypes() : throw_expression(err as TypeErrorNotAssignable);
						ASTNodeCP.typeCheckAssignment(argitemtype, entrytype, this);
					}
				}
				return returntype.mutableOf();
			}],
		]).get(this.base.source as ValidFunctionName) || invalid_function_name(this.base.source))();
	}

	@memoizeMethod
	public override fold(): OBJ.Object | null {
		const argvalue: OBJ.Object | null | undefined = (this.exprargs.length) // TODO #fold should not return native `null` if it cannot assess
			? this.exprargs[0].fold()
			: undefined;
		if (argvalue === null) {
			return null;
		}
		return new Map<ValidFunctionName, (argument: OBJ.Object | undefined) => OBJ.Object | null>([
			[ValidFunctionName.LIST, (tuple)  => (tuple  === undefined) ? new OBJ.List() : new OBJ.List((tuple as OBJ.CollectionIndexed).items)],
			[ValidFunctionName.DICT, (record) => (record === undefined) ? new OBJ.Dict() : new OBJ.Dict((record as OBJ.CollectionKeyed).properties)],
			[ValidFunctionName.SET,  (tuple)  => (tuple  === undefined) ? new OBJ.Set()  : new OBJ.Set(new Set<OBJ.Object>((tuple as OBJ.CollectionIndexed).items))],
			[ValidFunctionName.MAP,  (tuple)  => (tuple  === undefined) ? new OBJ.Map()  : new OBJ.Map(new Map<OBJ.Object, OBJ.Object>((tuple as OBJ.CollectionIndexed).items.map((pair) => (pair as OBJ.CollectionIndexed).items as [OBJ.Object, OBJ.Object])))],
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
	private countArgs(expected_generic: ArgCount, expected_function: ArgCount): void {
		const actual_generic:  bigint = BigInt(this.typeargs.length);
		const actual_function: bigint = BigInt(this.exprargs.length);
		if (typeof expected_generic === 'bigint') {
			expected_generic = [expected_generic, expected_generic + 1n];
		}
		if (typeof expected_function === 'bigint') {
			expected_function = [expected_function, expected_function + 1n];
		}
		if (actual_generic < expected_generic[0]) {
			throw new TypeErrorArgCount(actual_generic, expected_generic[0], true, this);
		}
		if (expected_generic[1] <= actual_generic) {
			throw new TypeErrorArgCount(actual_generic, expected_generic[1] - 1n, true, this);
		}
		if (actual_function < expected_function[0]) {
			throw new TypeErrorArgCount(actual_function, expected_function[0], false, this);
		}
		if (expected_function[1] <= actual_function) {
			throw new TypeErrorArgCount(actual_function, expected_function[1] - 1n, false, this);
		}
	}
}
