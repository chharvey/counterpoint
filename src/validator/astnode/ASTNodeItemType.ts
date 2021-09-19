import type {PARSENODE} from './package.js';
import type {ASTNodeType} from './index.js';
import {ASTNodeSolid} from './ASTNodeSolid.js';



export class ASTNodeItemType extends ASTNodeSolid {
	constructor (
		start_node:
			| PARSENODE.ParseNodeEntryType
			| PARSENODE.ParseNodeEntryType_Optional
		,
		readonly optional: boolean,
		readonly value: ASTNodeType,
	) {
		super(start_node, {optional}, [value]);
	}
}
