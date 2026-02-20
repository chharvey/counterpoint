import type {AST} from '../../validator/index.ts';
import type {VALUE} from '../../typer/index.ts';
import {CfgNode} from './CfgNode.ts';



/**
 * Values are not sent as instructions to the Optimizer,
 * but are still needed for representation.
 */
export abstract class Value extends CfgNode {
}



export class Constant extends Value {
	public constructor(private readonly value: VALUE.Primitive) {
		super();
	}

	public override toString(): string {
		return this.value.toString();
	}
}



export class Variable extends Value {
	public constructor(private readonly node: AST.ASTNodeVariable) {
		super();
	}

	public override toString(): string {
		return this.node.source;
	}
}
