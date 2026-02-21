import type {AST} from '../../validator/index.ts';
import type {VALUE} from '../../typer/index.ts';
import {Instruction} from './Instruction.ts';



export class Constant extends Instruction {
	public constructor(private readonly value: VALUE.Primitive) {
		super();
	}

	public override toString(): string {
		return this.value.toString();
	}
}



export class Variable extends Instruction {
	public constructor(private readonly node: AST.ASTNodeVariable) {
		super();
	}

	public override toString(): string {
		return this.node.source;
	}
}
