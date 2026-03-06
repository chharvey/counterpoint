import type binaryen from 'binaryen';
import * as xjs from 'extrajs';
import type {Builder} from '../../index.ts';
import {
	memoizeMethod,
	runOnceMethod,
} from '../../lib/index.ts';
import type {TYPE} from '../../typer/index.ts';
import {TypeName} from './TypeName.ts';
import {Value} from './Value.ts';



/** Create a Map. */
export class MapNew extends Value {
	public constructor(
		private readonly cases: ReadonlyMap<Value, Value>,
		typ: TYPE.Type,
	) {
		super(typ);
	}

	public override toString(): string {
		return `(${ [`${ TypeName[TypeName.MAP] }.NEW`, ...[...this.cases].map(([ant, con]) => `${ ant }->${ con }`)].join(' ') })`;
	}

	@runOnceMethod
	public override validate(): void {
		return xjs.Map.forEachAggregated(this.cases, (con, ant) => xjs.Array.forEachAggregated([ant, con], (value) => value.validate()));
	}

	@memoizeMethod
	public override codegen(_: Builder): binaryen.ExpressionRef {
		throw new Error('not yet supported.');
	}
}
