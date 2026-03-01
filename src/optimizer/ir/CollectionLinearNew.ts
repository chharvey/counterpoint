import type {TYPE} from '../../typer/index.ts';
import {TypeName} from './Type.ts';
import {Value} from './Value.ts';



/** Create an indexed collection (tuple/List/Set). */
export class CollectionLinearNew extends Value {
	public constructor(
		private readonly name:  TypeName.TUPLE | TypeName.LIST | TypeName.SET,
		private readonly items: readonly Value[],
		typ: TYPE.Type,
	) {
		super(typ);
	}

	public override toString(): string {
		return `(${ TypeName[this.name] }.NEW ${ this.items.join(' ') })`;
	}
}
