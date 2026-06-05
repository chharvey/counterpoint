import * as assert from 'node:assert';
import type binaryen from 'binaryen';
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
class IrSet extends Instruction {
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
	public override validate(builder: Builder): void {
		if (builder.localStatus(this.target) === undefined) {
			throw new ReferenceError(`Local with id \`${ this.target.id }\` must be declared before setting!`);
		}
		builder.registerLocal(this.target, 'set');
		this.value.validate(builder);
		return assert.ok(this.value.type.isSubtypeOf(this.targetType), `${ this.value.type } must be a subtype of ${ this.targetType }.`);
	}

	public override interpret(interp: Interpreter): void {
		interp;
	}

	@memoizeMethod
	public override codegen(cg: CodeGenerator): binaryen.ExpressionRef {
		return cg.getLocal(this.target)?.set(this.value.codegen(cg)) ?? assert.fail(new ReferenceError(`Local with id \`${ this.target.id }\` must be set first!`));
	}
}
export {IrSet as Set};
