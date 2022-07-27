import * as assert from 'assert';
import {
	TYPE,
	OBJ,
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
	protected override type_do(): TYPE.Type {
		return new TYPE.TypeMap(
			TYPE.Type.unionAll(this.children.map((c) => c.antecedent.type())),
			TYPE.Type.unionAll(this.children.map((c) => c.consequent.type())),
			true,
		);
	}
	protected override fold_do(): OBJ.Object | null {
		const cases: ReadonlyMap<OBJ.Object | null, OBJ.Object | null> = new Map(this.children.map((c) => [
			c.antecedent.fold(),
			c.consequent.fold(),
		]));
		return ([...cases].some((c) => c[0] === null || c[1] === null))
			? null
			: new OBJ.SolidMap(cases as ReadonlyMap<OBJ.Object, OBJ.Object>);
	}
}
