import * as assert from 'assert';
import * as xjs from 'extrajs';
import {
	TYPE,
	TypeError05,
	TypeError06,
} from '../../index.js';
import {
	type NonemptyArray,
	memoizeMethod,
} from '../../lib/index.js';
import {
	type CPConfig,
	CONFIG_DEFAULT,
} from '../../core/index.js';
import type {SyntaxNodeFamily} from '../utils-private.js';
import {
	type ArgCount,
	ValidFunctionName,
	invalidFunctionName,
} from './utils-private.js';
import {ASTNodeType} from './ASTNodeType.js';
import {ASTNodeTypeAlias} from './ASTNodeTypeAlias.js';



export class ASTNodeTypeCall extends ASTNodeType {
	public static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeTypeCall {
		const typ: ASTNodeType = ASTNodeType.fromSource(src, config);
		assert.ok(typ instanceof ASTNodeTypeCall);
		return typ;
	}

	public constructor(
		start_node: SyntaxNodeFamily<'type_compound', ['variable']>,
		private readonly base: ASTNodeType,
		private readonly args: Readonly<NonemptyArray<ASTNodeType>>,
	) {
		super(start_node, {}, [base, ...args]);
	}

	public override varCheck(): void {
		// NOTE: ignore var-checking `this.base` for now, as we are using syntax to determine semantics.
		// (`this.base.source` must be a `ValidFunctionName`)
		return xjs.Array.forEachAggregated(this.args, (arg) => arg.varCheck());
	}

	@memoizeMethod
	public override eval(): TYPE.Type {
		if (!(this.base instanceof ASTNodeTypeAlias)) {
			throw new TypeError05(this.base.eval(), this.base);
		}
		return (new Map<ValidFunctionName, () => TYPE.Type>([
			[ValidFunctionName.LIST, () => (this.countArgs(1n), new TYPE.TypeList(this.args[0].eval()))],
			[ValidFunctionName.DICT, () => (this.countArgs(1n), new TYPE.TypeDict(this.args[0].eval()))],
			[ValidFunctionName.SET,  () => (this.countArgs(1n), new TYPE.TypeSet (this.args[0].eval()))],
			[ValidFunctionName.MAP,  () => {
				this.countArgs([1n, 3n]);
				const anttype: TYPE.Type = this.args[0].eval();
				const contype: TYPE.Type = this.args[1]?.eval() ?? anttype; // eslint-disable-line @typescript-eslint/no-unnecessary-condition --- `this.args[1]` could be undefined
				return new TYPE.TypeMap(anttype, contype);
			}],
		]).get(this.base.source as ValidFunctionName) || invalidFunctionName(this.base.source))();
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
	private countArgs(expected: ArgCount): void {
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
