import {
	TYPE,
	TypeError,
} from '../../index.ts';
import {
	assert_instanceof,
	memoizeMethod,
} from '../../lib/index.ts';
import {
	type CPConfig,
	CONFIG_DEFAULT,
} from '../../core/index.ts';
import type {SyntaxNodeType} from '../utils-private.ts';
import {ASTNodeType} from './ASTNodeType.ts';
import {ASTNodeTypeCollectionLiteral} from './ASTNodeTypeCollectionLiteral.ts';



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
			return new TYPE.List(itemstype);
		} else if (this.count >= 0) {
			const types: readonly TYPE.Type[] = [...new Array<undefined>(Number(this.count))].map(() => itemstype);
			return TYPE.Tuple.fromTypes(types);
		} else {
			throw new TypeError(`Tuple type \`${ this.source }\` instantiated with count less than 0.`, 0, this.line_index, this.col_index);
		}
	}
}
