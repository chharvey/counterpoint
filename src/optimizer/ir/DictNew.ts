import type {AST} from '../../validator/index.ts';
import {VALUE} from '../../typer/index.ts';
import {TypeName} from './Type.ts';
import {Value} from './Value.ts';
import {Const} from './Const.ts';



/** Create a Dict. */
export class DictNew extends Value {
	private readonly props: readonly (readonly [Const, Value])[];

	public constructor(props: readonly (readonly [AST.ASTNodeKey, Value])[], typ: TypeName) {
		super(typ);
		this.props = props.map(([key, value]) => [new Const(new VALUE.Symbol(key.id, key.source)), value]);
	}

	public override toString(): string {
		return `(${ TypeName[TypeName.DICT] }.NEW ${ this.props.flat().join(' ') })`;
	}
}
