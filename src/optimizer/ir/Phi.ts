import * as xjs from 'extrajs';
import {runOnceMethod} from '../../lib/index.ts';
import {Value} from './Value.ts';
import type {Label} from './Label.ts';



/**
 * A Phi function merges branches of control flow in SSA form.
 * @see https://en.wikipedia.org/wiki/Static_single-assignment_form
 */
export class Phi extends Value {
	private readonly labelThen: Label;
	private readonly labelElse: Label;
	private readonly valueThen: Value;
	private readonly valueElse: Value;

	public constructor(
		[then_label, then_value]: readonly [Label, Value],
		[else_label, else_value]: readonly [Label, Value],
	) {
		super(then_value.type.union(else_value.type));
		this.labelThen = then_label;
		this.labelElse = else_label;
		this.valueThen = then_value;
		this.valueElse = else_value;
	}

	@runOnceMethod
	public override validate(): void {
		return xjs.Array.forEachAggregated([this.valueThen, this.valueElse], (value) => value.validate());
	}

	public override toString(): string {
		return `(PHI "${ this.labelThen.name }"->${ this.valueThen } "${ this.labelElse.name }"->${ this.valueElse })`;
	}
}
