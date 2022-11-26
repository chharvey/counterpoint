import * as assert from 'assert';
import {
	TYPE,
	CPConfig,
	CONFIG_DEFAULT,
	SyntaxNodeType,
} from './package.js';
import {ASTNodeType} from './ASTNodeType.js';



export class ASTNodeTypeMap extends ASTNodeType {
	public static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeTypeMap {
		const typ: ASTNodeType = ASTNodeType.fromSource(src, config);
		assert.ok(typ instanceof ASTNodeTypeMap);
		return typ;
	}

	public constructor(
		start_node: SyntaxNodeType<'type_map_literal'>,
		private readonly antecedenttype: ASTNodeType,
		private readonly consequenttype: ASTNodeType,
	) {
		super(start_node, {}, [antecedenttype, consequenttype]);
	}

	protected override eval_do(): TYPE.Type {
		return new TYPE.TypeMap(this.antecedenttype.eval(), this.consequenttype.eval());
	}
}