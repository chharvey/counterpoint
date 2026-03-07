import * as xjs from 'extrajs';
import {runOnceMethod} from '../../lib/index.ts';
import type {TYPE} from '../../typer/index.ts';
import {OpCode} from './utils-public.ts';
import {Value} from './Value.ts';



/** Create a record. */
export class RecordNew extends Value {
	public constructor(
		private readonly props: ReadonlyMap<bigint, {readonly keysrc?: string, readonly value: Value}>,
		typ: TYPE.Type,
	) {
		super(OpCode.RECORD_NEW, typ);
	}

	@runOnceMethod
	public override validate(): void {
		return xjs.Map.forEachAggregated(this.props, ({value}) => value.validate());
	}

	public override toString(): string {
		// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing --- keysrc may be empty string
		return `(${ [this.opCodeString, ...[...this.props].map(([keyid, {keysrc, value}]) => `@${ keysrc || `\\x${ keyid.toString(16) }` }->${ value }`)].join(' ') })`;
	}
}
