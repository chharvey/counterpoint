import * as assert from 'assert';
import {TYPE} from '../../index.js';
import {memoizeMethod} from '../../lib/index.js';
import {
	CPConfig,
	CONFIG_DEFAULT,
} from '../../core/index.js';
import type {SyntaxNodeType} from '../utils-private.js';
import {ASTNodeType} from './ASTNodeType.js';



export class ASTNodeTypeSet extends ASTNodeType {
	public static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeTypeSet {
		const typ: ASTNodeType = ASTNodeType.fromSource(src, config);
		assert.ok(typ instanceof ASTNodeTypeSet);
		return typ;
	}

	public constructor(
		start_node: SyntaxNodeType<'type_unary_symbol'>,
		private readonly type: ASTNodeType,
	) {
		super(start_node, {}, [type]);
	}

	@memoizeMethod
	public override eval(): TYPE.Type {
		return new TYPE.TypeSet(this.type.eval());
	}
}
