import * as assert from 'assert';
import {
	SolidType,
	SolidTypeTuple,
	SolidTypeList,
	memoizeMethod,
	SolidConfig,
	CONFIG_DEFAULT,
	PARSENODE,
	Validator,
} from './package.js';
import {ASTNodeType} from './ASTNodeType.js';



export class ASTNodeTypeList extends ASTNodeType {
	static override fromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ASTNodeTypeList {
		const typ: ASTNodeType = ASTNodeType.fromSource(src, config);
		assert.ok(typ instanceof ASTNodeTypeList);
		return typ;
	}
	constructor (
		start_node: PARSENODE.ParseNodeTypeUnarySymbol,
		readonly type:  ASTNodeType,
		readonly count: bigint | null,
	) {
		super(start_node, {count}, [type]);
	}
	@memoizeMethod
	override assess(validator: Validator): SolidType {
		const itemstype: SolidType = this.type.assess(validator);
		return (this.count === null)
			? new SolidTypeList(itemstype)
			: SolidTypeTuple.fromTypes(Array.from(new Array(Number(this.count)), () => itemstype));
	}
}
