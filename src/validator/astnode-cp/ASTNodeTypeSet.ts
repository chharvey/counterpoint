import * as assert from 'assert';
import {
	TYPE,
	CPConfig,
	CONFIG_DEFAULT,
	SyntaxNodeType,
} from './package.js';
import {ASTNodeType} from './ASTNodeType.js';



export class ASTNodeTypeSet extends ASTNodeType {
	public static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeTypeSet {
		const typ: ASTNodeType = ASTNodeType.fromSource(src, config);
		assert.ok(typ instanceof ASTNodeTypeSet);
		return typ;
	}

	public constructor(
		start_node: SyntaxNodeType<'type_unary_symbol'>,
		private readonly type: ASTNodeType,
	) {
		super(start_node, {}, [type]);
	}

	protected override eval_do(): TYPE.Type {
		return new TYPE.TypeSet(this.type.eval());
	}
}
