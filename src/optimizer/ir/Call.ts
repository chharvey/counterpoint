import * as xjs from 'extrajs';
import {runOnceMethod} from '../../lib/index.ts';
import type {TYPE} from '../../typer/index.ts';
import {Value} from './Value.ts';



/** Call a function or constructor. */
export class Call extends Value {
	public constructor(
		private readonly callable: Value,
		private readonly args:     readonly Value[],
		return_type: TYPE.Type,
	) {
		super(return_type);
	}

	@runOnceMethod
	public override validate(): void {
		return xjs.Array.forEachAggregated([this.callable, ...this.args], (value) => value.validate());
	}

	public override toString(): string {
		return `(${ ['CALL', this.callable, ...this.args].join(' ') })`;
	}
}
