import type {TYPE} from '../../typer/index.ts';
import type {Optimizer} from '../Optimizer.ts';
import {as_unit} from './utils-private.ts';
import {Value} from './Value.ts';



export class SetNew extends Value {
	public constructor(
		private readonly elems: readonly Value[],
		typ:       TYPE.Type,
		optimizer: Optimizer,
	) {
		super(typ);
		this.elems = elems.map((elem) => as_unit(optimizer, elem));
	}

	public override toString(): string {
		return `(SET.NEW ${ this.elems.join(' ') })`;
	}
}
