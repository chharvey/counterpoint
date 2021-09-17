import type {PARSENODE} from './package.js';
import type {ASTNodeConstant} from './index.js';
import {ASTNodeSolid} from './ASTNodeSolid.js';



export class ASTNodeIndex extends ASTNodeSolid {
	constructor (
		start_node: PARSENODE.ParseNodePropertyAccess,
		readonly value: ASTNodeConstant,
	) {
		super(start_node, {}, [value]);
	}
}
