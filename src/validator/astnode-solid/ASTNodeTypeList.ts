import * as assert from 'assert';
import {
	SolidType,
	SolidTypeTuple,
	SolidTypeList,
	SolidConfig,
	CONFIG_DEFAULT,
	SyntaxNodeType,
} from './package.js';
import {ASTNodeType} from './ASTNodeType.js';



export class ASTNodeTypeList extends ASTNodeType {
	static override fromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ASTNodeTypeList {
		const typ: ASTNodeType = ASTNodeType.fromSource(src, config);
		assert.ok(typ instanceof ASTNodeTypeList);
		return typ;
	}
	constructor (
		start_node: SyntaxNodeType<'type_unary_symbol'>,
		readonly type:  ASTNodeType,
		readonly count: bigint | null,
	) {
		super(start_node, {count}, [type]);
	}
	protected override eval_do(): SolidType {
		const itemstype: SolidType = this.type.eval();
		return (this.count === null)
			? new SolidTypeList(itemstype)
			: SolidTypeTuple.fromTypes(Array.from(new Array(Number(this.count)), () => itemstype));
	}
}
