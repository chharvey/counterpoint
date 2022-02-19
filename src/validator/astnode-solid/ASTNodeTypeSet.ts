import * as assert from 'assert';
import {
	SolidType,
	SolidTypeSet,
	SolidConfig,
	CONFIG_DEFAULT,
	SyntaxNodeType,
} from './package.js';
import {ASTNodeType} from './ASTNodeType.js';



export class ASTNodeTypeSet extends ASTNodeType {
	static override fromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ASTNodeTypeSet {
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
	protected override eval_do(): SolidType {
		return new SolidTypeSet(this.type.eval());
	}
}
