import type {
	TOKEN,
} from './package.js';
import {ASTNodeEbnf} from './ASTNodeEbnf.js';



export class ASTNodeParam extends ASTNodeEbnf {
	constructor (parse_node: TOKEN.TokenIdentifier) {
		super(parse_node, {name: parse_node.source});
	}
}
