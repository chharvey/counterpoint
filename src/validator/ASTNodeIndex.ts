import type {PARSER} from '../parser/index.js';
import type {ASTNodeConstant} from './index.js';
import {ASTNodeSolid} from './ASTNodeSolid.js';



export class ASTNodeIndex extends ASTNodeSolid {
	constructor (
		start_node: PARSER.ParseNodePropertyAccess,
		readonly value: ASTNodeConstant,
	) {
		super(start_node, {}, [value]);
	}
}
