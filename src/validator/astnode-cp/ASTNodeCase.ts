import type {SyntaxNodeType} from '../utils-private.ts';
import type {ASTNodeExpression} from './index.ts';
import {ASTNodeCP} from './ASTNodeCP.ts';



export class ASTNodeCase extends ASTNodeCP {
	public constructor(
		start_node: SyntaxNodeType<'case'>,
		public readonly antecedent: ASTNodeExpression,
		public readonly consequent: ASTNodeExpression,
	) {
		super(start_node, {}, [antecedent, consequent]);
	}
}
