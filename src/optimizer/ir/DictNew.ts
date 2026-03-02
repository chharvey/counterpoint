import * as assert from 'node:assert';
import * as xjs from 'extrajs';
import {runOnceMethod} from '../../lib/index.ts';
import type {AST} from '../../validator/index.ts';
import {
	VALUE,
	TYPE,
} from '../../typer/index.ts';
import {TypeName} from './TypeName.ts';
import {Value} from './Value.ts';
import {Const} from './Const.ts';



/** Create a Dict. */
export class DictNew extends Value {
	private readonly props: readonly (readonly [Const, Value])[];

	public constructor(props: readonly (readonly [AST.ASTNodeKey, Value])[], typ: TYPE.Type) {
		super(typ);
		this.props = props.map(([key, value]) => [new Const(new VALUE.Symbol(key.id, key.source)), value]);
	}

	@runOnceMethod
	public override validate(): void {
		return xjs.Array.forEachAggregated(this.props, ([key, value]) => {
			assert.ok(key.type.isSubtypeOf(TYPE.SYM));
			return value.validate();
		});
	}

	public override toString(): string {
		return `(${ TypeName[TypeName.DICT] }.NEW ${ this.props.flat().join(' ') })`;
	}
}
