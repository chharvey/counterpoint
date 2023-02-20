import type {SyntaxNodeType} from '../utils-private.js';
import type {ASTNodeExpression} from './index.js';
import {ASTNodeCP} from './ASTNodeCP.js';



export class ASTNodeCase extends ASTNodeCP {
	public constructor(
		start_node: SyntaxNodeType<'case'>,
		public readonly antecedent: ASTNodeExpression,
		public readonly consequent: ASTNodeExpression,
	) {
		super(start_node, {}, [antecedent, consequent]);
	}
}
