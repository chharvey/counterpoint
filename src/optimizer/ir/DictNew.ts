import * as xjs from 'extrajs';
import {runOnceMethod} from '../../lib/index.ts';
import type {
	VALUE,
	TYPE,
} from '../../typer/index.ts';
import {TypeName} from './TypeName.ts';
import {Value} from './Value.ts';



/** Create a Dict. */
export class DictNew extends Value {
	public constructor(
		private readonly props: ReadonlyMap<VALUE.Symbol, Value>,
		typ: TYPE.Type,
	) {
		super(typ);
	}

	@runOnceMethod
	public override validate(): void {
		return xjs.Map.forEachAggregated(this.props, (value) => value.validate());
	}

	public override toString(): string {
		return `(${ [`${ TypeName[TypeName.DICT] }.NEW`, ...[...this.props].map(([sym, value]) => `${ sym }->${ value }`)].join(' ') })`;
	}
}
