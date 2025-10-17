import type {SyntaxNodeType} from '../utils-private.ts';
import type {ASTNodeExpression} from './index.ts';
import {ASTNodeCP} from './ASTNodeCP.ts';
import type {ASTNodeKey} from './ASTNodeKey.ts';



export class ASTNodeProperty extends ASTNodeCP {
	public constructor(
		start_node: SyntaxNodeType<'property'>,
		public readonly key: ASTNodeKey,
		public readonly val: ASTNodeExpression,
	) {
		super(start_node, {}, [key, val]);
	}
}
