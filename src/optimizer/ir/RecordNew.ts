import binaryen from 'binaryen';
import * as xjs from 'extrajs';
import {
	Field_new,
	bigint_to_i64,
	type Builder,
} from '../../index.ts';
import {
	assert_instanceof,
	memoizeMethod,
	runOnceMethod,
} from '../../lib/index.ts';
import {TYPE} from '../../typer/index.ts';
import type {TypeBuilder} from '../../builder/-types.d.ts';
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
		// @ts-expect-error --- WASM 3.0 (incl. GC) not typed yet
		// eslint-disable-next-line
		const tb: TypeBuilder = new binaryen.TypeBuilder(1);
		if (!COUNT) {
			tb.setStructType(0, []);
			return cg.module.struct.new_default(tb.buildAndDispose()[0]);
		}
		/** An array of `$Entry`s, which will go into the record’s struct. */
		const entries = new Array<binaryen.ExpressionRef>(COUNT);
		this.props.forEach(({value}, id) => {
			const code: binaryen.ExpressionRef = value.codegen(cg);
			/** A separate TypeBuilder for each property. */
			// @ts-expect-error --- WASM 3.0 (incl. GC) not typed yet
			// eslint-disable-next-line
			const prop_tb: TypeBuilder = new binaryen.TypeBuilder(1);
			/*
			 * (type $Entry (struct
			 * 	(field $key   i64)
			 * 	(field $value ‹type of value›)
			 * ))
			 */
			prop_tb.setStructType(0, [binaryen.i64, binaryen.getExpressionType(code)].map((typ) => Field_new(typ)));
			const entry: binaryen.ExpressionRef = cg.module.struct.new([
				bigint_to_i64(cg.module, id),
				code,
			], prop_tb.buildAndDispose()[0]);
			/**
			 * Find a bucket in which to place the entry.
			 * By default this will have index `id mod COUNT`,
			 * but in the case of collisions we will use the *linear probing* technique.
			 * @see https://en.wikipedia.org/wiki/Linear_probing
			 */
			function insertEntry(index: number): void {
				if (!entries[index]) {
					entries[index] = entry;
					return;
				}
				return insertEntry((index + 1) % COUNT);
			}
			insertEntry(Number(id) % COUNT);
		});
		tb.setStructType(0, entries.map((entry) => Field_new(binaryen.getExpressionType(entry))));
		return cg.module.struct.new(entries, tb.buildAndDispose()[0]);
	}
}
