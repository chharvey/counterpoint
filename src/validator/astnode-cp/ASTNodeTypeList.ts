import {
	TYPE,
	TypeError,
} from '../../index.js';
import {
	assert_instanceof,
	memoizeMethod,
} from '../../lib/index.js';
import {
	type CPConfig,
	CONFIG_DEFAULT,
} from '../../core/index.js';
import type {SyntaxNodeType} from '../utils-private.js';
import {ASTNodeType} from './ASTNodeType.js';
import {ASTNodeTypeCollectionLiteral} from './ASTNodeTypeCollectionLiteral.js';



export class ASTNodeTypeList extends ASTNodeTypeCollectionLiteral {
	public static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeTypeList {
		const typ: ASTNodeType = ASTNodeType.fromSource(src, config);
		assert_instanceof(typ, ASTNodeTypeList);
		return typ;
	}

	public constructor(
		start_node: SyntaxNodeType<'type_unary_symbol'>,
		private readonly type:  ASTNodeType,
		private readonly count: bigint | null = null,
	) {
		super(start_node, [type], {count});
	}

	@memoizeMethod
	public override eval(): TYPE.Type {
		const itemstype: TYPE.Type = this.type.eval();
		if (this.count === null) {
			return new TYPE.TypeList(itemstype);
		} else if (this.count >= 0) {
			const types: readonly TYPE.Type[] = [...new Array(Number(this.count))].map(() => itemstype);
			return TYPE.TypeTuple.fromTypes(types);
		} else {
			throw new TypeError(`Tuple type \`${ this.source }\` instantiated with count less than 0.`, 0, this.line_index, this.col_index);
		}
	}
}
