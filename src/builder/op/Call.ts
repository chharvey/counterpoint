import type {TYPE} from '../../typer/index.ts';
import {Validator} from '../../validator/index.ts';
import {OpCode} from './Opcode.ts';
import {Value} from './Value.ts';
import type {ValueTac} from './ValueTac.ts';



/** Call a function or constructor. */
export class Call extends Value {
	public constructor(
		public readonly callable:  ValueTac,
		public readonly argsPosit: readonly ValueTac[],
		public readonly argsNamed: ReadonlyMap<bigint, ValueTac>,
		return_type: TYPE.Type,
	) {
		super(OpCode.CALL, return_type);
	}

	public override toString(): string {
		return super.toString(
			this.callable,
			...this.argsPosit,
			...[...this.argsNamed].map(([key, val]) => `(@${Validator.unhashIdentifierId(key)}->${val})`),
		);
	}
}
