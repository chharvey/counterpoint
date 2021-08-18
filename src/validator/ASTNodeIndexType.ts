import type {PARSER} from '../parser/index.js';
import type {ASTNodeTypeConstant} from './index.js';
import {ASTNodeSolid} from './ASTNodeSolid.js';



export class ASTNodeIndexType extends ASTNodeSolid {
	constructor (
		start_node: PARSER.ParseNodePropertyAccessType,
		readonly value: ASTNodeTypeConstant,
	) {
		super(start_node, {}, [value]);
	}
}
