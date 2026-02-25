import type {TYPE} from '../../typer/index.ts';
import type {Optimizer} from '../Optimizer.ts';
import {as_unit} from './utils-private.ts';
import {Value} from './Value.ts';



type Prop = readonly [bigint, Value];



export enum CollectionKeyedName {
	RECORD,
	DICT,
}



export class CollectionKeyedNew extends Value {
	public constructor(
		private readonly name:  CollectionKeyedName,
		private readonly props: readonly Prop[],
		typ:       TYPE.Type,
		optimizer: Optimizer,
	) {
		super(typ);
		this.props = props.map(([keyid, value]) => [keyid, as_unit(optimizer, value)]);
	}

	public override toString(): string {
		const keys:   readonly string[] = this.props.map(([keyid]) => `#x${ keyid.toString(16) }`);
		const values: readonly Value[]  = this.props.map(([_, value]) => value);
		return `(${ CollectionKeyedName[this.name] }.NEW ${ keys.join(' ') } ${ values.join(' ') })`;
	}
}
