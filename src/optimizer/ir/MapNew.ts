import type {TYPE} from '../../typer/index.ts';
import {TypeName} from './Type.ts';
import {Value} from './Value.ts';



/** Create a Map. */
export class MapNew extends Value {
	public constructor(
		private readonly cases: readonly (readonly [Value, Value])[],
		typ: TYPE.Type,
	) {
		super(typ);
	}

	public override toString(): string {
		return `(${ TypeName[TypeName.MAP] }.NEW ${ this.cases.flat().join(' ') })`;
	}
}
