import type * as TOKEN from '@chharvey/parser/dist/ebnf/Token.js';
import {ASTNodeEbnf} from './ASTNodeEbnf.js';



export class ASTNodeCondition extends ASTNodeEbnf {
	constructor (
		parse_node: TOKEN.TokenIdentifier,
		readonly include: boolean,
	) {
		// @ts-expect-error
		super(parse_node, {name: parse_node.source, include});
	}
}
