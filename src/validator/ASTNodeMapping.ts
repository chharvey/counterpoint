import type {
	NonemptyArray,
} from '@chharvey/parser';
import * as assert from 'assert';
import {
	SolidConfig,
	CONFIG_DEFAULT,
	PARSENODE,
	SolidType,
	SolidTypeMapping,
	SolidObject,
	SolidMapping,
	INST,
	Builder,
} from './package.js';
import type {ASTNodeCase} from './ASTNodeCase.js';
import {ASTNodeExpression} from './ASTNodeExpression.js';
import type {Validator} from './Validator.js';



export class ASTNodeMapping extends ASTNodeExpression {
	static override fromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ASTNodeMapping {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert.ok(expression instanceof ASTNodeMapping);
		return expression;
	}
	constructor (
		start_node: PARSENODE.ParseNodeMappingLiteral,
		override readonly children: Readonly<NonemptyArray<ASTNodeCase>>,
	) {
		super(start_node, {}, children);
	}
	override shouldFloat(_validator: Validator): boolean {
		throw 'ASTNodeMapping#shouldFloat not yet supported.';
	}
	protected override build_do(builder: Builder): INST.InstructionExpression {
		throw builder && 'ASTNodeMapping#build_do not yet supported.';
	}
	protected override type_do(validator: Validator): SolidType {
		return new SolidTypeMapping(
			SolidType.unionAll(this.children.map((c) => c.antecedent.type(validator))),
			SolidType.unionAll(this.children.map((c) => c.consequent.type(validator))),
		);
	}
	protected override assess_do(validator: Validator): SolidObject | null {
		const cases: ReadonlyMap<SolidObject | null, SolidObject | null> = new Map(this.children.map((c) => [
			c.antecedent.assess(validator),
			c.consequent.assess(validator),
		]));
		return ([...cases].some((c) => c[0] === null || c[1] === null))
			? null
			: new SolidMapping(cases as ReadonlyMap<SolidObject, SolidObject>);
	}
}
