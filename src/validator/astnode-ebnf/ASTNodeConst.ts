import {
	EBNFObject,
	EBNFChoice,
	TOKEN,
} from './package.js';
import type {ConcreteNonterminal} from './utils-private.js';
import {ASTNodeExpr} from './ASTNodeExpr.js';



export class ASTNodeConst extends ASTNodeExpr {
	constructor (
		private readonly p_node:
			| TOKEN.TokenCharCode
			| TOKEN.TokenString
			| TOKEN.TokenCharClass
		,
	) {
		super(p_node, {value: p_node.source});
	}

	override transform(_nt: ConcreteNonterminal, _data: EBNFObject[]): EBNFChoice {
		return [
			[
				(this.p_node instanceof TOKEN.TokenCharCode) ? `\\u${ this.source.slice(2).padStart(4, '0') }` : // remove '#x'
				(this.p_node instanceof TOKEN.TokenCharClass) ? `'${ this.source }'` :
				this.source.slice(1, -1) // remove double-quotes
			],
		];
	}
}
