import * as assert from 'node:assert';
import type binaryen from 'binaryen';
import type {Builder} from '../../index.ts';
import {
	memoizeMethod,
	runOnceMethod,
} from '../../lib/index.ts';
import {SymbolSchemaVar} from '../../validator/index.ts';
import type {TYPE} from '../../typer/index.ts';
import type {Temp} from '../utils-private.ts';
import type {Instruction} from './Instruction.ts';
import {
	OpCode,
	Opcode,
} from './Opcode.ts';
import type {Value} from './Value.ts';



/** Write a value to a variable/local. */
class IrSet extends Opcode implements Instruction {
	private readonly targetType: TYPE.Type;

	public constructor(
		private readonly target: SymbolSchemaVar | Temp,
		private readonly value:  Value,
	) {
		super(OpCode.SET);
		this.targetType = this.target instanceof SymbolSchemaVar ? this.target.irType : this.target.type;
	}

	public override toString(): string {
		return super.toString(
			this.target instanceof SymbolSchemaVar ? this.target.source : this.target.name,
			this.value,
		);
	}

	@runOnceMethod
	public override validate(): void {
		this.value.validate();
		return assert.ok(this.value.type.isSubtypeOf(this.targetType));
	}

	@memoizeMethod
	public override codegen(cg: Builder): binaryen.ExpressionRef {
		return cg.localSet(this.target.id, this.value.codegen(cg));
	}
}
export {IrSet as Set};
