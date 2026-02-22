import type {AST} from '../../validator/index.ts';
import {Value} from './Value.ts';



export class Get extends Value {
	public constructor(private readonly target: AST.ASTNodeVariable | string) {
		super();
	}

	public override toString(): string {
		return `(GET ${ typeof this.target === 'string' ? this.target : this.target.source })`;
	}
}
