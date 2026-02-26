import {AST} from '../../validator/index.ts';
import type {Local} from '../utils-public.ts';
import {Value} from './Value.ts';



/** Read the value of a variable/local. */
export class Get extends Value {
	public constructor(private readonly target: AST.ASTNodeVariable | Local) {
		super(target instanceof AST.ASTNodeVariable ? target.type() : target.type);
	}

	public override toString(): string {
		return `(GET ${ this.target instanceof AST.ASTNodeVariable ? this.target.source : this.target.name })`;
	}

	public override asTac(): Get {
		return this;
	}
}
