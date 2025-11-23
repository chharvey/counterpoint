import type {SyntaxNodeFamily} from '../utils-private.ts';
import type {ASTNodeExpression} from './index.ts';
import {ASTNodeCP} from './ASTNodeCP.ts';



export class ASTNodeCase extends ASTNodeCP {
	public constructor(
		start_node: SyntaxNodeFamily<'case', ['break']>,
		public readonly antecedent: ASTNodeExpression,
		public readonly consequent: ASTNodeExpression,
	) {
		super(start_node, {}, [antecedent, consequent]);
	}
}
