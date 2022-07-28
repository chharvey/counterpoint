import * as assert from 'assert';
import {
	TYPE,
	CPConfig,
	CONFIG_DEFAULT,
	SyntaxNodeType,
} from './package.js';
import {ASTNodeType} from './ASTNodeType.js';



export class ASTNodeTypeDict extends ASTNodeType {
	static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeTypeDict {
		const typ: ASTNodeType = ASTNodeType.fromSource(src, config);
		assert.ok(typ instanceof ASTNodeTypeDict);
		return typ;
	}
	constructor (
		start_node: SyntaxNodeType<'type_dict_literal'>,
		readonly type: ASTNodeType,
	) {
		super(start_node, {}, [type]);
	}
	protected override eval_do(): TYPE.Type {
		return new TYPE.TypeDict(this.type.eval());
	}
}
