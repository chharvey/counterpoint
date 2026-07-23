import type * as binaryen from 'binaryen.ts';
import * as xjs from 'extrajs';
import type {CodeGenerator} from '../../index.ts';
import {
	assert_instanceof,
	memoizeMethod,
	runOnceMethod,
} from '../../lib/index.ts';
import {
	VALUE,
	TYPE,
} from '../../typer/index.ts';
import type {Builder} from '../Builder.ts';
import type {Interpreter} from '../Interpreter.ts';
import {OpCode} from './Opcode.ts';
import {Value} from './Value.ts';
import type {ValueTac} from './ValueTac.ts';



/** Create a Map. */
export class MapNew extends Value {
	public constructor(
		private readonly cases: ReadonlyMap<ValueTac, ValueTac>,
		typ: TYPE.Type,
	) {
		super(OpCode.MAP_NEW, typ);
	}

	public override toString(): string {
		return super.toString(...[...this.cases].map(([ant, con]) => `${ ant }->${ con }`));
	}

	@runOnceMethod
	public override validate(builder: Builder): void {
		assert_instanceof(this.type, TYPE.Map);
		return xjs.Map.forEachAggregated(this.cases, (con, ant) => xjs.Array.forEachAggregated([ant, con], (value) => value.validate(builder)));
	}

	public override interpret(interp: Interpreter): VALUE.Map {
		return new VALUE.Map(new Map<VALUE.Value, VALUE.Value>([...this.cases].map(([ant, con]) => [
			ant.interpret(interp),
			con.interpret(interp),
		])));
	}

	@memoizeMethod
	public override codegen(cg: CodeGenerator): binaryen.ExpressionRef {
		return cg.vm.Value.newComposite(cg.codegenMap(new Map([...this.cases].map(([ant, con]) => [ant.codegen(cg), con.codegen(cg)]))));
	}
}
