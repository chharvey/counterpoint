import * as assert from 'assert';
import {
	SolidType,
	SolidTypeMap,
	SolidObject,
	SolidMap,
	INST,
	Builder,
	NonemptyArray,
	memoizeMethod,
	SolidConfig,
	CONFIG_DEFAULT,
	PARSENODE,
} from './package.js';
import type {ASTNodeCase} from './ASTNodeCase.js';
import {ASTNodeExpression} from './ASTNodeExpression.js';
import {ASTNodeCollectionLiteral} from './ASTNodeCollectionLiteral.js';



export class ASTNodeMap extends ASTNodeCollectionLiteral {
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
	override type(): SolidType {
		return new SolidTypeMap(
			SolidType.unionAll(this.children.map((c) => c.antecedent.type())),
			SolidType.unionAll(this.children.map((c) => c.consequent.type())),
			true,
		);
	}
	@memoizeMethod
	override fold(): SolidObject | null {
		const cases: ReadonlyMap<SolidObject | null, SolidObject | null> = new Map(this.children.map((c) => [
			c.antecedent.fold(),
			c.consequent.fold(),
		]));
		return ([...cases].some((c) => c[0] === null || c[1] === null))
			? null
			: new SolidMap(cases as ReadonlyMap<SolidObject, SolidObject>);
	}
}
