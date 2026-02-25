import type {TYPE} from '../../typer/index.ts';
import type {Optimizer} from '../Optimizer.ts';
import {as_unit} from './utils-private.ts';
import {Value} from './Value.ts';



type Case = readonly [Value, Value];



export class MapNew extends Value {
	private readonly cases: readonly Case[];

	public constructor(props: readonly Case[], typ: TYPE.Type, optimizer: Optimizer) {
		super(typ);
		this.cases = props.map(([ant, con]) => [as_unit(optimizer, ant), as_unit(optimizer, con)]);
	}

	public override toString(): string {
		return `(MAP.NEW ${ this.cases.map(([ant, con]) => `(#${ ant } ${ con })`).join(' ') })`;
	}
}
