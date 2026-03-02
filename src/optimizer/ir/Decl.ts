import * as assert from 'node:assert';
import {runOnceMethod} from '../../lib/index.ts';
import {SymbolSchemaVar} from '../../validator/index.ts';
import type {TYPE} from '../../typer/index.ts';
import type {Local} from '../utils-private.ts';
import {
	TypeName,
	ast_type_name,
} from './TypeName.ts';
import {Instruction} from './Instruction.ts';
import type {Value} from './Value.ts';



/** Declare a variable/local without initializing it. */
export class Decl extends Instruction {
	private readonly targetType: TYPE.Type;

	public constructor(
		private readonly target: SymbolSchemaVar | Local,
		private readonly value:  Value,
	) {
		super();
		this.targetType = this.target instanceof SymbolSchemaVar ? this.target.irType : this.target.type;
	}

	@runOnceMethod
	public override validate(): void {
		this.value.validate();
		return assert.ok(this.value.type.isSubtypeOf(this.targetType));
	}

	public override toString(): string {
		return `(DECL ${ TypeName[ast_type_name(this.targetType)] } ${ this.target instanceof SymbolSchemaVar ? this.target.source : this.target.name } ${ this.value })`;
	}
}
