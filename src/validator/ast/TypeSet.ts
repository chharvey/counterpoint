import {TYPE} from '../../index.ts';
import {
	assert_instanceof,
	memoizeMethod,
} from '../../lib/index.ts';
import {
	type CplConfig,
	CONFIG_DEFAULT,
} from '../../core/index.ts';
import type {SyntaxNodeType} from '../utils-private.ts';
import {ASTNodeType} from './Type.ts';
import {ASTNodeTypeCollectionLiteral} from './TypeCollectionLiteral.ts';



export class ASTNodeTypeSet extends ASTNodeTypeCollectionLiteral {
	public static override fromSource(src: string, config: CplConfig = CONFIG_DEFAULT): ASTNodeTypeSet {
		const typ: ASTNodeType = ASTNodeType.fromSource(src, config);
		assert_instanceof(typ, ASTNodeTypeSet);
		return typ;
	}

	public constructor(
		start_node: SyntaxNodeType<'type_set_literal'>,
		private readonly type: ASTNodeType,
	) {
		super(start_node, [type]);
	}

	@memoizeMethod
	public override eval(): TYPE.Type {
		return new TYPE.Set(this.type.eval());
	}
}
