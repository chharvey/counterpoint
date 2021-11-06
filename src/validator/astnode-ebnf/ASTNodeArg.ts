import type {
	TOKEN,
} from './package.js';
import {ASTNodeEbnf} from './ASTNodeEbnf.js';



export class ASTNodeArg extends ASTNodeEbnf {
	constructor (
		parse_node: TOKEN.TokenIdentifier,
		readonly append: boolean | 'inherit',
	) {
		super(parse_node, {name: parse_node.source, append});
	}
}
