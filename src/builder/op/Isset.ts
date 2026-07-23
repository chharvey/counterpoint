import * as assert from 'node:assert';
import type * as binaryen from 'binaryen.ts';
import type {CodeGenerator} from '../../index.ts';
import {
	memoizeMethod,
	runOnceMethod,
} from '../../lib/index.ts';
import {VALUE} from '../../typer/index.ts';
import type {SymbolSchemaVar} from '../../validator/index.ts';
import type {Builder} from '../Builder.ts';
import type {Interpreter} from '../Interpreter.ts';
import {OpCode} from './Opcode.ts';
import {Value} from './Value.ts';



/** Return whether a variable has been assigned/reassigned. */
export class Isset extends Value {
	public constructor(private readonly target: SymbolSchemaVar) {
		super(OpCode.ISSET, target.irType);
	}

	public override toString(): string {
		return super.toString(this.target.source);
	}

	@runOnceMethod
	public override validate(builder: Builder): void {
		if (builder.getLocalStatus(this.target) === undefined) {
			throw new ReferenceError(`Local with id \`${ this.target.id }\` must be declared before testing!`);
		}
	}

	public override interpret(interp: Interpreter): VALUE.Value {
		const value: VALUE.Value | null | undefined = interp.getLocalValue(this.target);
		switch (value) {
			case undefined: { throw new ReferenceError(`Local with id \`${ this.target.id }\` must be declared first!`); };
			case null:      { return VALUE.FALSE; }
			default:        { return VALUE.TRUE; }
		}
	}

	@memoizeMethod
	public override codegen(cg: CodeGenerator): binaryen.ExpressionRef {
		const local: binaryen.ExpressionRef = cg.getLocal(this.target)?.get() ?? assert.fail(new ReferenceError(`Local with id \`${ this.target.id }\` must be declared first!`));
		return cg.vm.Value.boolFromI32(cg.mod.wasm.i32.eqz(cg.mod.wasm.i32.eqz(cg.vm.Value.field(local).tag)));
	}
}
