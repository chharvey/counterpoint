import type {SyntaxNodeFamily} from '../utils-private.ts';
import type {ASTNodeType} from './index.ts';
import {ASTNodeCP} from './ASTNodeCP.ts';
import type {ASTNodeKey} from './ASTNodeKey.ts';



export class ASTNodePropertyType extends ASTNodeCP {
	public constructor(
		start_node: SyntaxNodeFamily<'entry_type__named', ['optional']>,
		public readonly optional: boolean,
		public readonly key:       ASTNodeKey,
		public readonly typevalue: ASTNodeType,
	) {
		super(start_node, {optional}, [key, typevalue]);
	}
}
