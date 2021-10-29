import {
	Token,
	ParseNode,
	ASTNode,
} from './package.js';



export class ASTNodeEbnf extends ASTNode {
	constructor (
		parse_node: ParseNode | Token,
		attributes: {[key: string]: boolean | number | string} = {},
		children:   readonly ASTNode[] = [],
	) {
		super(parse_node, attributes, children);
	}
}
