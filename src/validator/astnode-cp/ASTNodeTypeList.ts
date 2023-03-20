import * as assert from 'assert';
import {
	TYPE,
	TypeError,
} from '../../index.js';
import {
	throw_expression,
	memoizeMethod,
} from '../../lib/index.js';
import {
	type CPConfig,
	CONFIG_DEFAULT,
} from '../../core/index.js';
import type {SyntaxNodeFamily} from '../utils-private.js';
import {ASTNodeType} from './ASTNodeType.js';
import {ASTNodeTypeCollectionLiteral} from './ASTNodeTypeCollectionLiteral.js';



export class ASTNodeTypeList extends ASTNodeTypeCollectionLiteral {
	public static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeTypeList {
		const typ: ASTNodeType = ASTNodeType.fromSource(src, config);
		assert.ok(typ instanceof ASTNodeTypeList);
		return typ;
	}

	public constructor(
		start_node: SyntaxNodeFamily<'type_unary_symbol', ['variable']>,
		private readonly type:  ASTNodeType,
		is_ref: boolean,
		private readonly count: bigint | null = null,
	) {
		super(start_node, [type], is_ref, {count});
	}

	@memoizeMethod
	public override eval(): TYPE.Type {
		const itemstype: TYPE.Type = this.type.eval();
		if (!this.isRef) {
			assert.notStrictEqual(this.count, null);
		}
		return (this.count === null)
			? new TYPE.TypeList(itemstype)
			: (this.count >= 0)
				? TYPE.TypeTuple.fromTypes(Array.from(new Array(Number(this.count)), () => itemstype))
				: throw_expression(new TypeError(`Tuple type \`${ this.source }\` instantiated with count less than 0.`, 0, this.line_index, this.col_index));
	}
}
