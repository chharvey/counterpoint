import type {SyntaxNodeFamily} from '../utils-private.ts';
import type {Expression} from './index.ts';
import {ASTNodeCP} from './ASTNodeCP.ts';
import type {Key} from './Key.ts';



export class Property extends ASTNodeCP {
	public constructor(
		start_node: SyntaxNodeFamily<'property', ['break']>,
		public readonly key: Key,
		public readonly val: Expression,
	) {
		super(start_node, {}, [key, val]);
	}
}
