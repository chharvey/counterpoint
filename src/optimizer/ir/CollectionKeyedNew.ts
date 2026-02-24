import type {TYPE} from '../../typer/index.ts';
import type {Optimizer} from '../Optimizer.ts';
import {as_unit} from './utils-private.ts';
import {Value} from './Value.ts';



type Prop = readonly [bigint, Value];



export class RecordNew extends Value {
	private readonly props: readonly Prop[];

	public constructor(optimizer: Optimizer, props: readonly Prop[], typ: TYPE.Type) {
		super(typ);
		this.props = props.map(([keyid, value]) => [keyid, as_unit(optimizer, value)]);
	}

	public override toString(): string {
		return `(RECORD.NEW ${ this.props.map(([keyid, value]) => `(#x${ keyid.toString(16) } ${ value })`).join(' ') })`;
	}
}
