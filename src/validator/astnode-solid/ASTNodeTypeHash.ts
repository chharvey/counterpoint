import * as assert from 'assert';
import {
	SolidType,
	SolidTypeHash,
	SolidConfig,
	CONFIG_DEFAULT,
	SyntaxNodeType,
} from './package.js';
import {ASTNodeType} from './ASTNodeType.js';



export class ASTNodeTypeHash extends ASTNodeType {
	static override fromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ASTNodeTypeHash {
		const typ: ASTNodeType = ASTNodeType.fromSource(src, config);
		assert.ok(typ instanceof ASTNodeTypeHash);
		return typ;
	}
	constructor (
		start_node: SyntaxNodeType<'type_hash_literal'>,
		readonly type: ASTNodeType,
	) {
		super(start_node, {}, [type]);
	}
	protected override eval_do(): SolidType {
		return new SolidTypeHash(this.type.eval());
	}
}
