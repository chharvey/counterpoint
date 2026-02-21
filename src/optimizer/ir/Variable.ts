import type {AST} from '../../validator/index.ts';
import {Instruction} from './Instruction.ts';



export class Variable extends Instruction {
	public constructor(private readonly node: AST.ASTNodeVariable) {
		super();
	}

	public override toString(): string {
		return this.node.source;
	}
}
