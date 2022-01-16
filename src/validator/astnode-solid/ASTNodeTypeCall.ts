import * as assert from 'assert';
import {
	SolidType,
	SolidTypeList,
	SolidTypeHash,
	SolidTypeSet,
	SolidTypeMap,
	TypeError05,
	TypeError06,
	NonemptyArray,
	forEachAggregated,
	SolidConfig,
	CONFIG_DEFAULT,
	PARSENODE,
} from './package.js';
import {ASTNodeType} from './ASTNodeType.js';
import {ASTNodeTypeAlias} from './ASTNodeTypeAlias.js';



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
	override varCheck(): void {
		// NOTE: ignore var-checking `this.base` for now, as we are using syntax to determine semantics.
		// (`this.base.source` must be `List | Hash | Set | Map`)
		return forEachAggregated(this.args, (arg) => arg.varCheck());
	}
	protected override eval_do(): SolidType {
		if (!(this.base instanceof ASTNodeTypeAlias)) {
			throw new TypeError05(this.base.eval(), this.base);
		}
		return (new Map<string, () => SolidType>([
			['List', () => (this.countArgs(1n), new SolidTypeList(this.args[0].eval()))],
			['Hash', () => (this.countArgs(1n), new SolidTypeHash(this.args[0].eval()))],
			['Set',  () => (this.countArgs(1n), new SolidTypeSet (this.args[0].eval()))],
			['Map',  () => {
				this.countArgs([1n, 3n]);
				const anttype: SolidType = this.args[0].eval();
				const contype: SolidType = this.args[1]?.eval() || anttype;
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
