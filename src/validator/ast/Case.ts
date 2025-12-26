import type {SyntaxNodeFamily} from '../utils-private.ts';
import type {Expression} from './index.ts';
import {ASTNodeCP} from './ASTNodeCP.ts';



export class Case extends ASTNodeCP {
	public constructor(
		start_node: SyntaxNodeFamily<'case', ['break']>,
		public readonly antecedent: Expression,
		public readonly consequent: Expression,
	) {
		super(start_node, {}, [antecedent, consequent]);
	}
}
