import * as xjs from 'extrajs';
import {runOnceMethod} from '../../lib/index.ts';
import type {AST} from '../../validator/index.ts';
import type {TYPE} from '../../typer/index.ts';
import {TypeName} from './TypeName.ts';
import {Value} from './Value.ts';



/** Create a record. */
export class RecordNew extends Value {
	public constructor(
		private readonly props: readonly (readonly [AST.ASTNodeKey, Value])[],
		typ: TYPE.Type,
	) {
		super(typ);
	}

	@runOnceMethod
	public override validate(): void {
		return xjs.Array.forEachAggregated(this.props, ([_, value]) => value.validate());
	}

	public override toString(): string {
		const keys:   readonly string[] = this.props.map(([key]) => `@${ key.source }`);
		const values: readonly Value[]  = this.props.map(([_, value]) => value);
		return `(${ TypeName[TypeName.RECORD] }.NEW ${ keys.join(' ') } ${ values.join(' ') })`;
	}
}
