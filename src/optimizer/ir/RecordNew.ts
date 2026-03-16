import type binaryen from 'binaryen';
import * as xjs from 'extrajs';
import {
	Property_new,
	BinValue,
	type Builder,
} from '../../index.ts';
import {
	assert_instanceof,
	memoizeMethod,
	runOnceMethod,
} from '../../lib/index.ts';
import {TYPE} from '../../typer/index.ts';
import {OpCode} from './Opcode.ts';
import {Value} from './Value.ts';



/** Create a record. */
export class RecordNew extends Value {
	public constructor(
		private readonly props: ReadonlyMap<bigint, {readonly keysrc?: string, readonly value: Value}>,
		typ: TYPE.Type,
	) {
		super(OpCode.RECORD_NEW, typ);
	}

	public override toString(): string {
		// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing --- keysrc may be empty string
		return super.toString(...[...this.props].map(([keyid, {keysrc, value}]) => `@${ keysrc || `\\x${ keyid.toString(16) }` }->${ value }`));
	}

	@runOnceMethod
	public override validate(): void {
		assert_instanceof(this.type, TYPE.Record);
		return xjs.Map.forEachAggregated(this.props, ({value}) => value.validate());
	}

	@memoizeMethod
	public override codegen(cg: Builder): binaryen.ExpressionRef {
		const COUNT: number = this.props.size;
		if (!COUNT) {
			return new BinValue(cg, cg.module.array.new_fixed(cg.getHeaptype('$Record')!, [])).value;
		}
		/** An array of `(ref $Property)`s, which will go into the record’s array. */
		const entries = new Array<binaryen.ExpressionRef>(COUNT);
		this.props.forEach(({value}, id) => {
			const entry: binaryen.ExpressionRef = Property_new(cg, id, value.codegen(cg));
			/**
			 * Find a bucket in which to place the entry.
			 * By default this will have index `id mod COUNT`,
			 * but in the case of collisions we will use the *linear probing* technique.
			 * @see https://en.wikipedia.org/wiki/Linear_probing
			 */
			function write_entry(index: number): void {
				if (entries[index]) {
					return write_entry((index + 1) % COUNT);
				}
				entries[index] = entry;
			}
			return write_entry(Number(id) % COUNT);
		});
		return new BinValue(cg, cg.module.array.new_fixed(cg.getHeaptype('$Record')!, entries)).value;
	}
}
