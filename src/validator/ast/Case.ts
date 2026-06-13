import type {SyntaxNodeFamily} from '../utils-private.ts';
import type {EXPR} from './index.ts';
import {AstNode} from './AstNode.ts';



export class Case extends AstNode {
	public constructor(
		start_node: SyntaxNodeFamily<'case', ['break']>,
		public readonly antecedent: EXPR.Expression,
		public readonly consequent: EXPR.Expression,
	) {
		super(start_node, {}, [antecedent, consequent]);
	}
}
