import {SymbolSchemaVar} from '../index.ts';
import type {SyntaxNodeFamily} from '../utils-private.ts';
import {AstNode} from './AstNode.ts';
import type {Functionlike} from './Functionlike.ts';
import type * as EXPR from './expression/index.ts';



export class Capture extends AstNode {
	public constructor(
		start_node: SyntaxNodeFamily<'capture', ['ref']>,
		public  readonly variable: EXPR.Variable,
		private readonly ref:      boolean,
	) {
		super(start_node, {ref}, [variable]);
	}


	public override varCheck(): void {
		super.varCheck();
		const schema = this.validator.getSymbol(this.variable.id) as SymbolSchemaVar;
		(this.parent as Functionlike).block.validator.addSymbol(new SymbolSchemaVar(
			schema.id,
			this.variable,
			schema.isWritable && this.ref,
			schema.isUninitialized,
		));
	}
}
