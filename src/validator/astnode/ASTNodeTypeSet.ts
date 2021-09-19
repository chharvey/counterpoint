import * as assert from 'assert';
import {
	SolidType,
	SolidTypeSet,
	memoizeMethod,
	SolidConfig,
	CONFIG_DEFAULT,
	PARSENODE,
	Validator,
} from './package.js';
import {ASTNodeType} from './ASTNodeType.js';



export class ASTNodeTypeSet extends ASTNodeType {
	static override fromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ASTNodeTypeSet {
		const typ: ASTNodeType = ASTNodeType.fromSource(src, config);
		assert.ok(typ instanceof ASTNodeTypeSet);
		return typ;
	}
	constructor (
		start_node: PARSENODE.ParseNodeTypeUnarySymbol,
		readonly type: ASTNodeType,
	) {
		super(start_node, {}, [type]);
	}
	@memoizeMethod
	override assess(validator: Validator): SolidType {
		return new SolidTypeSet(this.type.assess(validator));
	}
}
