import * as assert from 'assert';
import {
	TYPE,
	SolidTypeError,
	CPConfig,
	CONFIG_DEFAULT,
	SyntaxNodeType,
} from './package.js';
import {ASTNodeType} from './ASTNodeType.js';



export class ASTNodeTypeList extends ASTNodeType {
	static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeTypeList {
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
	protected override eval_do(): TYPE.SolidType {
		const itemstype: TYPE.SolidType = this.type.eval();
		return (this.count === null)
			? new TYPE.SolidTypeList(itemstype)
			: (this.count >= 0)
				? TYPE.SolidTypeTuple.fromTypes(Array.from(new Array(Number(this.count)), () => itemstype))
				: (() => { throw new SolidTypeError(`Tuple type \`${ this.source }\` instantiated with count less than 0.`, 0, this.line_index, this.col_index); })();
	}
}
