import type {SyntaxNodeFamily} from '../utils-private.ts';
import type {Expression} from './index.ts';
import {AstNode} from './AstNode.ts';



export class Case extends AstNode {
	public constructor(
		start_node: SyntaxNodeFamily<'case', ['break']>,
		public readonly antecedent: Expression,
		public readonly consequent: Expression,
	) {
		super(start_node, {}, [antecedent, consequent]);
	}
}
