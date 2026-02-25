import {assert_instanceof} from '../../lib/index.ts';
import {TYPE} from '../../typer/index.ts';
import type {Optimizer} from '../Optimizer.ts';
import {as_unit} from './utils-private.ts';
import {Value} from './Value.ts';
import {
	CollectionIndexedName,
	CollectionIndexedNew,
} from './CollectionIndexedNew.ts';



/** Create a Map. */
export class MapNew extends Value {
	/** An array of Get objects pointing to TupleNew objects. */
	private readonly cases: readonly Value[];

	public constructor(cases: readonly (readonly [Value, Value])[], typ: TYPE.Type, optimizer: Optimizer) {
		super(typ);
		assert_instanceof(typ, TYPE.Map);
		const entry_type: TYPE.Tuple = TYPE.Tuple.fromTypes([typ.typearg_ant, typ.typearg_con]);
		this.cases = cases.map(([ant, con]) => as_unit(optimizer, new CollectionIndexedNew(
			CollectionIndexedName.TUPLE,
			[as_unit(optimizer, ant), as_unit(optimizer, con)],
			entry_type,
			optimizer,
		)));
	}

	public override toString(): string {
		return `(MAP.NEW ${ this.cases.join(' ') })`;
	}
}
