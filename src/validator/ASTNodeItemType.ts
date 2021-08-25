import type {PARSER} from './package.js';
import type {ASTNodeType} from './index.js';
import {ASTNodeSolid} from './ASTNodeSolid.js';



export class ASTNodeItemType extends ASTNodeSolid {
	constructor (
		start_node:
			| PARSER.ParseNodeEntryType
			| PARSER.ParseNodeEntryType_Optional
		,
		readonly optional: boolean,
		readonly value: ASTNodeType,
	) {
		super(start_node, {optional}, [value]);
	}
}
