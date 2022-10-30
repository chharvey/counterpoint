import type {SyntaxNodeFamily} from './package.js';
import type {ASTNodeExpression} from './index.js';
import {ASTNodeCP} from './ASTNodeCP.js';
import type {ASTNodeKey} from './ASTNodeKey.js';



export class ASTNodeProperty extends ASTNodeCP {
	public constructor(
		start_node: SyntaxNodeFamily<'property', ['variable']>,
		public readonly key: ASTNodeKey,
		public readonly val: ASTNodeExpression,
	) {
		super(start_node, {}, [key, val]);
	}
}
