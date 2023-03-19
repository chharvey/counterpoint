import * as assert from 'assert';
import {TYPE} from '../../index.js';
import {memoizeMethod} from '../../lib/index.js';
import {
	type CPConfig,
	CONFIG_DEFAULT,
} from '../../core/index.js';
import type {SyntaxNodeType} from '../utils-private.js';
import {ASTNodeType} from './ASTNodeType.js';
import {ASTNodeTypeCollectionLiteral} from './ASTNodeTypeCollectionLiteral.js';



export class ASTNodeTypeMap extends ASTNodeTypeCollectionLiteral {
	public static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeTypeMap {
		const typ: ASTNodeType = ASTNodeType.fromSource(src, config);
		assert.ok(typ instanceof ASTNodeTypeMap);
		return typ;
	}

	public constructor(
		start_node: SyntaxNodeType<'type_map_literal'>,
		private readonly antecedenttype: ASTNodeType,
		private readonly consequenttype: ASTNodeType,
	) {
		super(start_node, [antecedenttype, consequenttype]);
	}

	@memoizeMethod
	public override eval(): TYPE.Type {
		return new TYPE.TypeMap(this.antecedenttype.eval(), this.consequenttype.eval());
	}
}
