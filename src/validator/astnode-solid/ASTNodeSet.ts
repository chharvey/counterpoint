import * as assert from 'assert';
import {
	SolidType,
	SolidTypeSet,
	SolidObject,
	SolidSet,
	INST,
	Builder,
	memoizeMethod,
	SolidConfig,
	CONFIG_DEFAULT,
	PARSENODE,
} from './package.js';
import {ASTNodeExpression} from './ASTNodeExpression.js';
import {ASTNodeCollectionLiteral} from './ASTNodeCollectionLiteral.js';



export class ASTNodeSet extends ASTNodeCollectionLiteral {
	static override fromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ASTNodeSet {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert.ok(expression instanceof ASTNodeSet);
		return expression;
	}
	constructor (
		start_node: PARSENODE.ParseNodeTupleLiteral,
		override readonly children: readonly ASTNodeExpression[],
	) {
		super(start_node, {}, children);
	}
	override shouldFloat(): boolean {
		throw 'ASTNodeSet#shouldFloat not yet supported.';
	}
	@memoizeMethod
	@ASTNodeExpression.buildDeco
	override build(builder: Builder): INST.InstructionExpression {
		throw builder && 'ASTNodeSet#build_do not yet supported.';
	}
	@memoizeMethod
	@ASTNodeExpression.typeDeco
	override type(): SolidType {
		return new SolidTypeSet(((this.children.length)
			? SolidType.unionAll(this.children.map((c) => c.type()))
			: SolidType.NEVER
		), true);
	}
	@memoizeMethod
	override fold(): SolidObject | null {
		const elements: readonly (SolidObject | null)[] = this.children.map((c) => c.fold());
		return (elements.includes(null))
			? null
			: new SolidSet(new Set(elements as SolidObject[]));
	}
}
