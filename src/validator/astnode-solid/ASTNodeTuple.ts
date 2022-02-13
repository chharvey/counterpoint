import * as assert from 'assert';
import {
	SolidType,
	SolidTypeTuple,
	SolidObject,
	SolidTuple,
	INST,
	Builder,
	SolidConfig,
	CONFIG_DEFAULT,
	SyntaxNodeType,
} from './package.js';
import {ASTNodeExpression} from './ASTNodeExpression.js';
import {ASTNodeCollectionLiteral} from './ASTNodeCollectionLiteral.js';



export class ASTNodeTuple extends ASTNodeCollectionLiteral {
	static override fromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ASTNodeTuple {
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
	protected override build_do(builder: Builder): INST.InstructionExpression {
		throw builder && 'ASTNodeTuple#build_do not yet supported.';
	}
	protected override type_do(): SolidType {
		return SolidTypeTuple.fromTypes(this.children.map((c) => c.type())).mutableOf();
	}
	protected override fold_do(): SolidObject | null {
		const items: readonly (SolidObject | null)[] = this.children.map((c) => c.fold());
		return (items.includes(null))
			? null
			: new SolidTuple(items as SolidObject[]);
	}
}
