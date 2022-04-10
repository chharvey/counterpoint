import * as assert from 'assert';
import {
	SolidType,
	SolidTypeHash,
	SolidConfig,
	CONFIG_DEFAULT,
	PARSENODE,
} from './package.js';
import {ASTNodeType} from './ASTNodeType.js';



export class ASTNodeTypeDict extends ASTNodeType {
	static override fromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ASTNodeTypeDict {
		const typ: ASTNodeType = ASTNodeType.fromSource(src, config);
		assert.ok(typ instanceof ASTNodeTypeDict);
		return typ;
	}
	constructor (
		start_node: PARSENODE.ParseNodeTypeDictLiteral,
		readonly type: ASTNodeType,
	) {
		super(start_node, {}, [type]);
	}
	protected override eval_do(): SolidType {
		return new SolidTypeHash(this.type.eval());
	}
}
