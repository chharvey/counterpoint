import * as assert from 'assert';
import {
	TYPE,
	SolidObject,
	SolidMap,
	INST,
	Builder,
	NonemptyArray,
	CPConfig,
	CONFIG_DEFAULT,
	SyntaxNodeType,
} from './package.js';
import type {ASTNodeCase} from './ASTNodeCase.js';
import {ASTNodeExpression} from './ASTNodeExpression.js';
import {ASTNodeCollectionLiteral} from './ASTNodeCollectionLiteral.js';



export class ASTNodeMap extends ASTNodeCollectionLiteral {
	static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeMap {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert.ok(expression instanceof ASTNodeMap);
		return expression;
	}
	constructor (
		start_node: SyntaxNodeType<'map_literal'>,
		override readonly children: Readonly<NonemptyArray<ASTNodeCase>>,
	) {
		super(start_node, children);
	}
	protected override build_do(builder: Builder): INST.InstructionExpression {
		throw builder && 'ASTNodeMap#build_do not yet supported.';
	}
	protected override type_do(): TYPE.SolidType {
		return new TYPE.SolidTypeMap(
			TYPE.SolidType.unionAll(this.children.map((c) => c.antecedent.type())),
			TYPE.SolidType.unionAll(this.children.map((c) => c.consequent.type())),
			true,
		);
	}
	protected override fold_do(): SolidObject | null {
		const cases: ReadonlyMap<SolidObject | null, SolidObject | null> = new Map(this.children.map((c) => [
			c.antecedent.fold(),
			c.consequent.fold(),
		]));
		return ([...cases].some((c) => c[0] === null || c[1] === null))
			? null
			: new SolidMap(cases as ReadonlyMap<SolidObject, SolidObject>);
	}
}
