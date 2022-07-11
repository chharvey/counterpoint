import * as assert from 'assert';
import * as xjs from 'extrajs';
import {
	SolidType,
	SolidTypeList,
	SolidTypeDict,
	SolidTypeSet,
	SolidTypeMap,
	TypeError05,
	TypeError06,
	NonemptyArray,
	SolidConfig,
	CONFIG_DEFAULT,
	SyntaxNodeType,
} from './package.js';
import {
	ValidFunctionName,
	invalidFunctionName,
} from './utils-private.js';
import {ASTNodeType} from './ASTNodeType.js';
import {ASTNodeTypeAlias} from './ASTNodeTypeAlias.js';



export class ASTNodeTypeCall extends ASTNodeType {
	static override fromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ASTNodeTypeCall {
		const typ: ASTNodeType = ASTNodeType.fromSource(src, config);
		assert.ok(typ instanceof ASTNodeTypeCall);
		return typ;
	}
	constructor (
		start_node: SyntaxNodeType<'type_compound'>,
		readonly base: ASTNodeType,
		readonly args: Readonly<NonemptyArray<ASTNodeType>>,
	) {
		super(start_node, {}, [base, ...args]);
	}
	override varCheck(): void {
		// NOTE: ignore var-checking `this.base` for now, as we are using syntax to determine semantics.
		// (`this.base.source` must be a `ValidFunctionName`)
		return xjs.Array.forEachAggregated(this.args, (arg) => arg.varCheck());
	}
	protected override eval_do(): SolidType {
		if (!(this.base instanceof ASTNodeTypeAlias)) {
			throw new TypeError05(this.base.eval(), this.base);
		}
		return (new Map<ValidFunctionName, () => SolidType>([
			[ValidFunctionName.LIST, () => (this.countArgs(1n), new SolidTypeList(this.args[0].eval()))],
			[ValidFunctionName.DICT, () => (this.countArgs(1n), new SolidTypeDict(this.args[0].eval()))],
			[ValidFunctionName.SET,  () => (this.countArgs(1n), new SolidTypeSet (this.args[0].eval()))],
			[ValidFunctionName.MAP,  () => {
				this.countArgs([1n, 3n]);
				const anttype: SolidType = this.args[0].eval();
				const contype: SolidType = this.args[1]?.eval() || anttype;
				return new SolidTypeMap(anttype, contype);
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
