import type {
	TOKEN,
} from './package.js';
import {ASTNodeEbnf} from './ASTNodeEbnf.js';



export class ASTNodeCondition extends ASTNodeEbnf {
	constructor (
		parse_node: TOKEN.TokenIdentifier,
		readonly include: boolean,
	) {
		super(parse_node, {name: parse_node.source, include});
	}
}
