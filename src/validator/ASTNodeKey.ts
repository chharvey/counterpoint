import type {TOKEN} from '../parser/index.js';
import {ASTNodeSolid} from './ASTNodeSolid.js';



export class ASTNodeKey extends ASTNodeSolid {
	readonly id: bigint;
	constructor (start_node: TOKEN.TokenKeyword | TOKEN.TokenIdentifier) {
		super(start_node, {id: start_node.cook()});
		this.id = start_node.cook()!;
	}
}
