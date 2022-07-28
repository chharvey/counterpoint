import * as assert from 'assert';
import {
	TYPE,
	OBJ,
	INST,
	Builder,
	NonemptyArray,
	memoizeMethod,
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
	override shouldFloat(): boolean {
		throw 'ASTNodeMap#shouldFloat not yet supported.';
	}
	@memoizeMethod
	@ASTNodeExpression.buildDeco
	override build(builder: Builder): INST.InstructionExpression {
		throw builder && 'ASTNodeMap#build not yet supported.';
	}
	@memoizeMethod
	@ASTNodeExpression.typeDeco
	override type(): TYPE.Type {
		return new TYPE.TypeMap(
			TYPE.Type.unionAll(this.children.map((c) => c.antecedent.type())),
			TYPE.Type.unionAll(this.children.map((c) => c.consequent.type())),
			true,
		);
	}
	@memoizeMethod
	override fold(): OBJ.Object | null {
		const cases: ReadonlyMap<OBJ.Object | null, OBJ.Object | null> = new Map(this.children.map((c) => [
			c.antecedent.fold(),
			c.consequent.fold(),
		]));
		return ([...cases].some((c) => c[0] === null || c[1] === null))
			? null
			: new OBJ.Map(cases as ReadonlyMap<OBJ.Object, OBJ.Object>);
	}
}
