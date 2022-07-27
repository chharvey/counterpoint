import * as assert from 'assert';
import {
	TYPE,
	SolidObject,
	SolidSet,
	INST,
	Builder,
	CPConfig,
	CONFIG_DEFAULT,
	SyntaxNodeType,
} from './package.js';
import {ASTNodeExpression} from './ASTNodeExpression.js';
import {ASTNodeCollectionLiteral} from './ASTNodeCollectionLiteral.js';



export class ASTNodeSet extends ASTNodeCollectionLiteral {
	static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeSet {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert.ok(expression instanceof ASTNodeSet);
		return expression;
	}
	constructor (
		start_node: SyntaxNodeType<'set_literal'>,
		override readonly children: readonly ASTNodeExpression[],
	) {
		super(start_node, children);
	}
	protected override build_do(builder: Builder): INST.InstructionExpression {
		throw builder && 'ASTNodeSet#build_do not yet supported.';
	}
	protected override type_do(): TYPE.Type {
		return new TYPE.TypeSet(((this.children.length)
			? TYPE.Type.unionAll(this.children.map((c) => c.type()))
			: TYPE.Type.NEVER
		), true);
	}
	protected override fold_do(): SolidObject | null {
		const elements: readonly (SolidObject | null)[] = this.children.map((c) => c.fold());
		return (elements.includes(null))
			? null
			: new SolidSet(new Set(elements as SolidObject[]));
	}
}
