import * as assert from 'assert';
import {
	TYPE,
	OBJ,
	INST,
	Builder,
	memoizeMethod,
	CPConfig,
	CONFIG_DEFAULT,
	SyntaxNodeType,
} from './package.js';
import {ASTNodeExpression} from './ASTNodeExpression.js';
import {ASTNodeCollectionLiteral} from './ASTNodeCollectionLiteral.js';



export class ASTNodeTuple extends ASTNodeCollectionLiteral {
	static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeTuple {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert.ok(expression instanceof ASTNodeTuple);
		return expression;
	}
	constructor (
		start_node: SyntaxNodeType<'tuple_literal'>,
		override readonly children: readonly ASTNodeExpression[],
	) {
		super(start_node, children);
	}
	override shouldFloat(): boolean {
		throw 'ASTNodeTuple#shouldFloat not yet supported.';
	}
	@memoizeMethod
	@ASTNodeExpression.buildDeco
	override build(builder: Builder): INST.InstructionExpression {
		throw builder && 'ASTNodeTuple#build not yet supported.';
	}
	@memoizeMethod
	@ASTNodeExpression.typeDeco
	override type(): TYPE.Type {
		return TYPE.TypeTuple.fromTypes(this.children.map((c) => c.type()), true);
	}
	@memoizeMethod
	override fold(): OBJ.Object | null {
		const items: readonly (OBJ.Object | null)[] = this.children.map((c) => c.fold());
		return (items.includes(null))
			? null
			: new OBJ.Tuple(items as OBJ.Object[]);
	}
}
