import * as assert from 'node:assert';
import type * as binaryen from 'binaryen.ts';
import type {CodeGenerator} from '../../index.ts';
import {
	memoizeMethod,
	runOnceMethod,
} from '../../lib/index.ts';
import {SymbolSchemaVar} from '../../validator/index.ts';
import type {TYPE} from '../../typer/index.ts';
import type {
	Temp,
	Builder,
} from '../Builder.ts';
import type {Interpreter} from '../Interpreter.ts';
import {OpCode} from './Opcode.ts';
import {Instruction} from './Instruction.ts';
import type {Value} from './Value.ts';



/** Write a value to a variable/local. */
class OpSet extends Instruction {
	private readonly targetType: TYPE.Type;

	public constructor(
		private readonly target: SymbolSchemaVar | Temp,
		private readonly value?: Value,
	) {
		super(OpCode.SET);
		this.targetType = this.target instanceof SymbolSchemaVar ? this.target.irType : this.target.type;
	}

	public override toString(): string {
		return super.toString(
			this.target instanceof SymbolSchemaVar ? this.target.source : this.target.name,
			...(this.value ? [this.value] : []),
		);
	}

	@runOnceMethod
	public override validate(builder: Builder): void {
		if (builder.getLocalStatus(this.target) === undefined) {
			throw new ReferenceError(`Local with id \`${ this.target.id }\` must be declared before setting!`);
		}
		builder.setLocalStatus(this.target, 'set');
		this.value?.validate(builder);
		return assert.ok(this.value?.type.isSubtypeOf(this.targetType) ?? true, `${ this.value?.type } must be a subtype of ${ this.targetType }.`);
	}

	public override interpret(interp: Interpreter): void {
		interp.setLocalValue(this.target, this.value?.interpret(interp));
	}

	@memoizeMethod
	public override codegen(cg: CodeGenerator): binaryen.ExpressionRef {
		return cg.getLocal(this.target)?.set(this.value?.codegen(cg) ?? cg.vm.Value.newDefault()) ?? assert.fail(new ReferenceError(`Local with id \`${ this.target.id }\` must be set first!`));
	}
}
export {OpSet as Set};
