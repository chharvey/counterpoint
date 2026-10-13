import {
	type Builder,
	OP,
} from '../../index.ts';
import {runOnceMethod} from '../../lib/index.ts';
import {SymbolSchemaVar} from '../index.ts';
import type {SyntaxNodeFamily} from '../utils-private.ts';
import {VisitorExprBuild} from './index.ts';
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
		(this.parent as Functionlike).block.validator.addSymbol(this.ref ? schema : new SymbolSchemaVar(
			schema.id,
			this.variable,
			schema.isWritable && this.ref,
			schema.isUninitialized,
		));
	}

	public override typeCheck(): void {
		super.typeCheck();
		if (!this.ref) {
			((this.parent as Functionlike).block.validator.getSymbol(this.variable.id) as SymbolSchemaVar).type = this.variable.type();
		}
	}

	@runOnceMethod
	public build(builder: Builder): void {
		if (!this.ref) {
			const schema = (this.parent as Functionlike).block.validator.getSymbol(this.variable.id) as SymbolSchemaVar;
			schema.irType = schema.type;
			return builder.pushInstruction(new OP.Decl(schema, schema.irType, new VisitorExprBuild(builder).visit(this.variable)));
		}
	}
}
