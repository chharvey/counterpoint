import type {
	SyntaxNodeType,
} from './package.js';
import type {ASTNodeType} from './index.js';
import {ASTNodeCP} from './ASTNodeCP.js';



export class ASTNodeItemType extends ASTNodeCP {
	constructor (
		start_node:
			| SyntaxNodeType<'entry_type'>
			| SyntaxNodeType<'entry_type__optional'>
		,
		readonly optional: boolean,
		readonly val: ASTNodeType,
	) {
		super(start_node, {optional}, [val]);
	}
}
