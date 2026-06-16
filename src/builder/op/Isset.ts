import type binaryen from 'binaryen';
import type {CodeGenerator} from '../../index.ts';
import {
	memoizeMethod,
	runOnceMethod,
} from '../../lib/index.ts';
import type {VALUE} from '../../typer/index.ts';
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

	public override interpret(_interp: Interpreter): VALUE.Value {
		throw new Error('not yet supported');
	}

	@memoizeMethod
	public override codegen(_cg: CodeGenerator): binaryen.ExpressionRef {
		throw new Error('not yet supported');
	}
}
