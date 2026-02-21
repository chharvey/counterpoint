import type {AST} from '../../validator/index.ts';
import {Instruction} from './Instruction.ts';



export class Get extends Instruction {
	public constructor(private readonly node: AST.ASTNodeVariable) {
		super();
	}

	public override toString(): string {
		return `(GET ${ this.node.source })`;
	}
}
