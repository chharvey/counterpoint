import * as assert from 'assert';
import {
	SolidConfig,
	CONFIG_DEFAULT,
	PARSER,
	SolidType,
	SolidTypeTuple,
	SolidObject,
	SolidTuple,
	INST,
	Builder,
} from './package.js';
import {mapAggregated} from './utilities.js';
import {ASTNodeExpression} from './ASTNodeExpression.js';
import type {Validator} from './Validator.js';



export class ASTNodeTuple extends ASTNodeExpression {
	static override fromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ASTNodeTuple {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert.ok(expression instanceof ASTNodeTuple);
		return expression;
	}
	constructor (
		start_node: PARSER.ParseNodeTupleLiteral,
		override readonly children: readonly ASTNodeExpression[],
	) {
		super(start_node, {}, children);
	}
	override shouldFloat(_validator: Validator): boolean {
		throw 'ASTNodeTuple#shouldFloat not yet supported.';
	}
	protected override build_do(builder: Builder): INST.InstructionExpression {
		throw builder && 'ASTNodeTuple#build_do not yet supported.';
	}
	protected override type_do(validator: Validator): SolidType {
		return SolidTypeTuple.fromTypes(mapAggregated(this.children, (c) => c.type(validator)));
	}
	protected override assess_do(validator: Validator): SolidObject | null {
		const items: readonly (SolidObject | null)[] = this.children.map((c) => c.assess(validator));
		return (items.includes(null))
			? null
			: new SolidTuple(items as SolidObject[]);
	}
}
