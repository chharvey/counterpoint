import type {
	TOKEN,
	SyntaxNodeType,
} from './package.js';
import {ASTNodeSolid} from './ASTNodeSolid.js';
import * as h from '../../../test/helpers-parse.js';



export class ASTNodeKey extends ASTNodeSolid {
	readonly id: bigint;
	constructor (start_node: TOKEN.TokenKeyword | TOKEN.TokenIdentifier | SyntaxNodeType<'word'>) {
		const id = (('tree' in start_node)
			? h.wordFromString(start_node.children[0].text).children[0] as TOKEN.TokenKeyword | TOKEN.TokenIdentifier
			: start_node
		).cook();
		super(start_node, {id});
		this.id = id!;
	}
}
