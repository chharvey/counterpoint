import type {AST} from '../../validator/index.ts';
import {
	VALUE,
	type TYPE,
} from '../../typer/index.ts';
import type {Optimizer} from '../Optimizer.ts';
import {as_unit} from './utils-private.ts';
import {Value} from './Value.ts';
import {Const} from './Const.ts';



/** Create a Dict. */
export class DictNew extends Value {
	private readonly props: readonly (readonly [Const, Value])[];

	public constructor(props: readonly (readonly [AST.ASTNodeKey, Value])[], typ: TYPE.Type, optimizer: Optimizer) {
		super(typ);
		this.props = props.map(([key, value]) => [new Const(new VALUE.Symbol(key.id, key.source)), as_unit(optimizer, value)]);
	}

	public override toString(): string {
		return `(DICT.NEW ${ this.props.map(([key, value]) => [key, value].join(' ')).join(' ') })`;
	}
}
