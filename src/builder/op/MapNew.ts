import type * as binaryen from 'binaryen.ts';
import type {CodeGenerator} from '../../index.ts';
import {memoizeMethod} from '../../lib/index.ts';
import {
	VALUE,
	type TYPE,
} from '../../typer/index.ts';
import type {Interpreter} from '../Interpreter.ts';
import {OpCode} from './Opcode.ts';
import {Value} from './Value.ts';
import type {ValueTac} from './ValueTac.ts';



/** Create a Map. */
export class MapNew extends Value {
	public constructor(
		public readonly cases: ReadonlyMap<ValueTac, ValueTac>,
		typ: TYPE.Type,
	) {
		super(OpCode.MAP_NEW, typ);
	}

	public override toString(): string {
		return super.toString(...[...this.cases].map(([ant, con]) => `${ant}->${con}`));
	}

	public override interpret(interp: Interpreter): VALUE.Map {
		return new VALUE.Map(new Map<VALUE.Value, VALUE.Value>([...this.cases].map(([ant, con]) => [
			ant.interpret(interp),
			con.interpret(interp),
		])));
	}

	@memoizeMethod
	public override codegen(cg: CodeGenerator): binaryen.ExpressionRef {
		return cg.vm.Value.fromMap(cg.codegenMap(new Map([...this.cases].map(([ant, con]) => [ant.codegen(cg), con.codegen(cg)]))));
	}
}
