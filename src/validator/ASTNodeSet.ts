import * as assert from 'assert';
import {
	SolidConfig,
	CONFIG_DEFAULT,
} from '../core/index.js';
import type {PARSER} from '../parser/index.js';
import {
	SolidType,
	SolidTypeSet,
	SolidObject,
	SolidSet,
} from '../typer/index.js';
import type {
	Builder,
	INST,
} from '../builder/index.js';
import {ASTNodeExpression} from './ASTNodeExpression.js';
import type {Validator} from './Validator.js';



export class ASTNodeSet extends ASTNodeExpression {
	static override fromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ASTNodeSet {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert.ok(expression instanceof ASTNodeSet);
		return expression;
	}
	constructor (
		start_node: PARSER.ParseNodeTupleLiteral,
		override readonly children: readonly ASTNodeExpression[],
	) {
		super(start_node, {}, children);
	}
	override shouldFloat(_validator: Validator): boolean {
		throw 'ASTNodeSet#shouldFloat not yet supported.';
	}
	protected override build_do(builder: Builder): INST.InstructionExpression {
		throw builder && 'ASTNodeSet#build_do not yet supported.';
	}
	protected override type_do(validator: Validator): SolidType {
		this.children.forEach((c) => c.typeCheck(validator)); // TODO: use forEachAggregated
		return new SolidTypeSet(
			(this.children.length)
				? SolidType.unionAll(this.children.map((c) => c.type(validator)))
				: SolidType.NEVER,
		);
	}
	protected override assess_do(validator: Validator): SolidObject | null {
		const elements: readonly (SolidObject | null)[] = this.children.map((c) => c.assess(validator));
		return (elements.includes(null))
			? null
			: new SolidSet(new Set(elements as SolidObject[]));
	}
}
