import * as assert from 'node:assert';
import {runOnceMethod} from '../../lib/index.ts';
import {TYPE} from '../../typer/index.ts';
import {Instruction} from './Instruction.ts';
import type {Value} from './Value.ts';
import type {Label} from './Label.ts';



/** Transfer control to the given label, but if and only if the given condition is false. */
export class GotoIfFalse extends Instruction {
	public constructor(
		private readonly condition: Value,
		private readonly label:     Label,
	) {
		super();
	}

	@runOnceMethod
	public override validate(): void {
		this.condition.validate();
		return assert.ok(this.condition.type.isSubtypeOf(TYPE.BOOL));
	}

	public override toString(): string {
		return `if_false ${ this.condition }, goto "${ this.label.name }".`;
	}
}
