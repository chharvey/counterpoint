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



export class ASTNodeTypeDict extends ASTNodeTypeCollectionLiteral {
	public static override fromSource(src: string, config: CplConfig = CONFIG_DEFAULT): ASTNodeTypeDict {
		const typ: ASTNodeType = ASTNodeType.fromSource(src, config);
		assert_instanceof(typ, ASTNodeTypeDict);
		return typ;
	}

	public constructor(
		start_node: SyntaxNodeType<'type_dict_literal'>,
		private readonly type: ASTNodeType,
	) {
		super(start_node, [type]);
	}

	@memoizeMethod
	public override eval(): TYPE.Type {
		return new TYPE.Dict(this.type.eval());
	}
}
