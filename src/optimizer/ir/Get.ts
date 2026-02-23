import {AST} from '../../validator/index.ts';
import type {TYPE} from '../../typer/index.ts';
import type {Local} from '../utils-public.ts';
import {Value} from './Value.ts';



/** Read the value of a variable/local. */
export class Get extends Value {
	public constructor(private readonly target: AST.ASTNodeVariable | Local) {
		super();
	}

	public override get type(): TYPE.Type {
		return this.target instanceof AST.ASTNodeVariable ? this.target.type() : this.target.type;
	}

	public override toString(): string {
		return `(GET ${ this.target instanceof AST.ASTNodeVariable ? this.target.source : this.target.name })`;
	}
}
