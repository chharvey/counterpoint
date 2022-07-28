import * as assert from 'assert';
import {
	TYPE,
	memoizeMethod,
	CPConfig,
	CONFIG_DEFAULT,
	SyntaxNodeType,
} from './package.js';
import {ASTNodeType} from './ASTNodeType.js';



export class ASTNodeTypeSet extends ASTNodeType {
	static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeTypeSet {
		const typ: ASTNodeType = ASTNodeType.fromSource(src, config);
		assert.ok(typ instanceof ASTNodeTypeSet);
		return typ;
	}
	constructor (
		start_node: SyntaxNodeType<'type_unary_symbol'>,
		readonly type: ASTNodeType,
	) {
		super(start_node, {}, [type]);
	}
	@memoizeMethod
	override eval(): TYPE.Type {
		return new TYPE.TypeSet(this.type.eval());
	}
}
