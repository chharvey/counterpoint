import type {PARSER} from '../parser/index.js';
import type {ASTNodeExpression} from './index.js';
import {ASTNodeSolid} from './ASTNodeSolid.js';
import type {ASTNodeKey} from './ASTNodeKey.js';



export class ASTNodeProperty extends ASTNodeSolid {
	constructor (
		start_node: PARSER.ParseNodeProperty,
		readonly key:   ASTNodeKey,
		readonly value: ASTNodeExpression,
	) {
		super(start_node, {}, [key, value]);
	}
}
