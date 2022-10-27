import * as assert from 'assert';
import {
	TYPE,
	OBJ,
	INST,
	Builder,
	CPConfig,
	CONFIG_DEFAULT,
	SyntaxNodeType,
} from './package.js';
import {ASTNodeExpression} from './ASTNodeExpression.js';
import {ASTNodeCollectionLiteral} from './ASTNodeCollectionLiteral.js';



export class ASTNodeSet extends ASTNodeCollectionLiteral {
	public static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeSet {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert.ok(expression instanceof ASTNodeSet);
		return expression;
	}

	public constructor(
		start_node: SyntaxNodeType<'set_literal'>,
		public override readonly children: readonly ASTNodeExpression[],
	) {
		super(start_node, children);
	}

	protected override build_do(builder: Builder): INST.InstructionExpression {
		throw builder && 'ASTNodeSet#build_do not yet supported.';
	}

	protected override type_do(): TYPE.Type {
		return new TYPE.TypeSet(
			TYPE.Type.unionAll(this.children.map((c) => c.type())),
			true,
		);
	}

	protected override fold_do(): OBJ.Object | null {
		const elements: readonly (OBJ.Object | null)[] = this.children.map((c) => c.fold());
		return (elements.includes(null))
			? null
			: new OBJ.Set(new Set(elements as OBJ.Object[]));
	}
}
