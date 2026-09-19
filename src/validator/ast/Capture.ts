import type {SyntaxNodeFamily} from '../utils-private.ts';
import {AstNode} from './AstNode.ts';
import type * as EXPR from './expression/index.ts';



export class Capture extends AstNode {
	public constructor(
		start_node: SyntaxNodeFamily<'capture', ['ref']>,
		private readonly variable: EXPR.Variable,
		private readonly ref:      boolean,
	) {
		super(start_node, {ref}, [variable]);
	}
}
