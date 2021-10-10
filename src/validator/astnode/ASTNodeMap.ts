import type {
	NonemptyArray,
} from '@chharvey/parser';
import * as assert from 'assert';
import {
	SolidConfig,
	CONFIG_DEFAULT,
	PARSENODE,
	SolidType,
	SolidTypeMap,
	SolidObject,
	SolidMap,
	INST,
	Builder,
	Validator,
} from './package.js';
import type {ASTNodeCase} from './ASTNodeCase.js';
import {ASTNodeExpression} from './ASTNodeExpression.js';



export class ASTNodeMap extends ASTNodeExpression {
	static override fromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ASTNodeMap {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert.ok(expression instanceof ASTNodeMap);
		return expression;
	}
	constructor (
		start_node: PARSENODE.ParseNodeMapLiteral,
		override readonly children: Readonly<NonemptyArray<ASTNodeCase>>,
	) {
		super(start_node, {}, children);
	}
	override shouldFloat(_validator: Validator): boolean {
		throw 'ASTNodeMap#shouldFloat not yet supported.';
	}
	protected override build_do(builder: Builder): INST.InstructionExpression {
		throw builder && 'ASTNodeMap#build_do not yet supported.';
	}
	protected override type_do(validator: Validator): SolidType {
		return new SolidTypeMap(
			SolidType.unionAll(this.children.map((c) => c.antecedent.type(validator))),
			SolidType.unionAll(this.children.map((c) => c.consequent.type(validator))),
		).mutableOf();
	}
	protected override fold_do(validator: Validator): SolidObject | null {
		const cases: ReadonlyMap<SolidObject | null, SolidObject | null> = new Map(this.children.map((c) => [
			c.antecedent.fold(validator),
			c.consequent.fold(validator),
		]));
		return ([...cases].some((c) => c[0] === null || c[1] === null))
			? null
			: new SolidMap(cases as ReadonlyMap<SolidObject, SolidObject>);
	}
}
