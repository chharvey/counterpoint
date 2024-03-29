import * as assert from 'assert';
import {
	SolidType,
	SolidTypeMap,
	SolidConfig,
	CONFIG_DEFAULT,
	PARSENODE,
} from './package.js';
import {ASTNodeType} from './ASTNodeType.js';



export class ASTNodeTypeMap extends ASTNodeType {
	static override fromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ASTNodeTypeMap {
		const typ: ASTNodeType = ASTNodeType.fromSource(src, config);
		assert.ok(typ instanceof ASTNodeTypeMap);
		return typ;
	}
	constructor (
		start_node: PARSENODE.ParseNodeTypeMapLiteral,
		readonly antecedenttype: ASTNodeType,
		readonly consequenttype: ASTNodeType,
	) {
		super(start_node, {}, [antecedenttype, consequenttype]);
	}
	protected override eval_do(): SolidType {
		return new SolidTypeMap(this.antecedenttype.eval(), this.consequenttype.eval());
	}
}
