import type {SyntaxNodeFamily} from '../utils-private.ts';
import type {Type} from './index.ts';
import {ASTNodeCP} from './ASTNodeCP.ts';
import type {Key} from './Key.ts';



export class PropertyType extends ASTNodeCP {
	public constructor(
		start_node: SyntaxNodeFamily<'entry_type__named', ['optional']>,
		public readonly optional: boolean,
		public readonly key:       Key,
		public readonly typevalue: Type,
	) {
		super(start_node, {optional}, [key, typevalue]);
	}
}
