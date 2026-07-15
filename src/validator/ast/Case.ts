import type {NonemptyArray} from '../../lib/index.ts';
import type {SyntaxNodeFamily} from '../utils-private.ts';
import type {EXPR} from './index.ts';
import {AstNode} from './AstNode.ts';



export class Case extends AstNode {
	public constructor(
		start_node: (
			| SyntaxNodeFamily<'case_map',    ['break']>
			| SyntaxNodeFamily<'case_switch', ['break']>
		),
		public readonly antecedents: Readonly<NonemptyArray<EXPR.Expression>>,
		public readonly consequent:  EXPR.Expression,
	) {
		super(start_node, {}, [...antecedents, consequent]);
	}
}
