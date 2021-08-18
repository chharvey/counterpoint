import type {PARSER} from '../parser/index.js';
import type {ASTNodeType} from './index.js';
import {ASTNodeSolid} from './ASTNodeSolid.js';
import type {ASTNodeKey} from './ASTNodeKey.js';



export class ASTNodePropertyType extends ASTNodeSolid {
	constructor (
		start_node:
			| PARSER.ParseNodeEntryType_Named
			| PARSER.ParseNodeEntryType_Named_Optional
		,
		readonly optional: boolean,
		readonly key:      ASTNodeKey,
		readonly value:    ASTNodeType,
	) {
		super(start_node, {optional}, [key, value]);
	}
}
