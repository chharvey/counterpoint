import {TYPE} from '../../index.ts';
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



export class ASTNodeTypeSet extends ASTNodeTypeCollectionLiteral {
	public static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeTypeSet {
		const typ: ASTNodeType = ASTNodeType.fromSource(src, config);
		assert_instanceof(typ, ASTNodeTypeSet);
		return typ;
	}

	public constructor(
		start_node: SyntaxNodeType<'type_set_literal'> | SyntaxNodeType<'type_unary_symbol'>,
		private readonly type: ASTNodeType,
	) {
		super(start_node, [type]);
	}

	@memoizeMethod
	public override eval(): TYPE.Type {
		return new TYPE.Set(this.type.eval());
	}
}
