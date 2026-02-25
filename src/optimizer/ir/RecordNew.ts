import type {AST} from '../../validator/index.ts';
import type {TYPE} from '../../typer/index.ts';
import type {Optimizer} from '../Optimizer.ts';
import {as_unit} from './utils-private.ts';
import {Value} from './Value.ts';



/** Create a record. */
export class RecordNew extends Value {
	public constructor(
		private readonly props: readonly (readonly [AST.ASTNodeKey, Value])[],
		typ:       TYPE.Type,
		optimizer: Optimizer,
	) {
		super(typ);
		this.props = props.map(([key, value]) => [key, as_unit(optimizer, value)]);
	}

	public override toString(): string {
		const keys:   readonly string[] = this.props.map(([key]) => `@${ key.source }`);
		const values: readonly Value[]  = this.props.map(([_, value]) => value);
		return `(RECORD.NEW ${ keys.join(' ') } ${ values.join(' ') })`;
	}
}
