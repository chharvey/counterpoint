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
import type {ASTNodeProperty} from './ASTNodeProperty.js';
import {ASTNodeExpression} from './ASTNodeExpression.js';
import {ASTNodeCollectionLiteral} from './ASTNodeCollectionLiteral.js';



export class ASTNodeRecord extends ASTNodeCollectionLiteral {
	static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeRecord {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert.ok(expression instanceof ASTNodeRecord);
		return expression;
	}
	constructor (
		start_node: SyntaxNodeType<'record_literal'>,
		override readonly children: Readonly<NonemptyArray<ASTNodeProperty>>,
	) {
		super(start_node, children);
	}
	override shouldFloat(): boolean {
		throw 'ASTNodeRecord#shouldFloat not yet supported.';
	}
	@memoizeMethod
	@ASTNodeExpression.buildDeco
	override build(builder: Builder): INST.InstructionExpression {
		throw builder && 'ASTNodeRecord#build not yet supported.';
	}
	@memoizeMethod
	@ASTNodeExpression.typeDeco
	override type(): TYPE.Type {
		return TYPE.TypeRecord.fromTypes(new Map(this.children.map((c) => [
			c.key.id,
			c.val.type(),
		])), true);
	}
	@memoizeMethod
	override fold(): OBJ.Object | null {
		const properties: ReadonlyMap<bigint, OBJ.Object | null> = new Map(this.children.map((c) => [
			c.key.id,
			c.val.fold(),
		]));
		return ([...properties].map((p) => p[1]).includes(null))
			? null
			: new OBJ.Record(properties as ReadonlyMap<bigint, OBJ.Object>);
	}
}
