import type binaryen from 'binaryen';
import * as xjs from 'extrajs';
import type {Builder} from '../../index.ts';
import {
	memoizeMethod,
	runOnceMethod,
} from '../../lib/index.ts';
import {TYPE} from '../../typer/index.ts';
import {TypeName} from './TypeName.ts';
import {Value} from './Value.ts';



/** Create a string template. */
export class Template extends Value {
	public constructor(private readonly items: readonly Value[]) {
		super(TYPE.STR);
	}

	public override toString(): string {
		return `(${ [`${ TypeName[TypeName.STR] }.TEMPLATE`, ...this.items].join(' ') })`;
	}

	@runOnceMethod
	public override validate(): void {
		return xjs.Array.forEachAggregated(this.items, (item) => item.validate());
	}

	@memoizeMethod
	public override codegen(_: Builder): binaryen.ExpressionRef {
		throw new Error('not yet supported.');
	}
}
