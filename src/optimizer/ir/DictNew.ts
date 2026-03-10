import binaryen from 'binaryen';
import * as xjs from 'extrajs';
import {
	DictEntry_new,
	bigint_to_i64,
	type Builder,
	BinVect,
} from '../../index.ts';
import {
	assert_instanceof,
	memoizeMethod,
	runOnceMethod,
} from '../../lib/index.ts';
import {
	type VALUE,
	TYPE,
} from '../../typer/index.ts';
import {OpCode} from './Opcode.ts';
import {Value} from './Value.ts';



/** Create a Dict. */
export class DictNew extends Value {
	public constructor(
		private readonly props: ReadonlyMap<VALUE.Symbol, Value>,
		typ: TYPE.Type,
	) {
		super(OpCode.DICT_NEW, typ);
	}

	public override toString(): string {
		return super.toString(...[...this.props].map(([sym, value]) => `${ sym }->${ value }`));
	}

	@runOnceMethod
	public override validate(): void {
		assert_instanceof(this.type, TYPE.Dict);
		return xjs.Map.forEachAggregated(this.props, (value) => value.validate());
	}

	@memoizeMethod
	public override codegen(cg: Builder): binaryen.ExpressionRef {
		const t_dict_internal: binaryen.Type = cg.typeRegistry.get('DictInternal')!;
		const t_dict:          binaryen.Type = cg.typeRegistry.get('Dict')!;

		/**
		 * An array’s capacity is always the least power of 2 greater than or equal to its count, or 8, whichever is greater.
		 * ```
		 * $Dict[$array].length === max(8, $Dict[$count])
		 * ```
		 */
		let capacity: number = 8;
		while (capacity < this.props.size) {
			capacity *= 2;
		}

		/**
		 * An array of `$Entry`s, which will go into the internal array.
		 * This array is sparse, because the number of items may be less than its capacity.
		 */
		const entries = new Array<binaryen.ExpressionRef | undefined>(capacity);
		this.props.forEach((value, {id}) => {
			const entry: binaryen.ExpressionRef = DictEntry_new(cg, id, value.codegen(cg));
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
				return insertEntry((index + 1) % capacity);
			}
			insertEntry(Number(id) % capacity);
		});

		/*
		 * create an empty raw array with the power of 2 capacity,
		 * fill in the entries,
		 * return a $Dict type with the $count and $array fields
		 */
		const internalarray_idx: number = Number(cg.nextLocalIndex());
		return cg.module.block(null, [
			cg.module.local.set(internalarray_idx, cg.module.array.new_default(t_dict_internal, cg.module.i32.const(capacity))),
			...[...entries].map((entry, i) => cg.module.array.set( // `entries` is sparse, so spreading it resolves all the “empty” slots to `undefined`
				cg.module.local.get(internalarray_idx, t_dict_internal),
				cg.module.i32.const(i),
				// @ts-expect-error --- WASM 3.0 (incl. GC) not typed yet
				// eslint-disable-next-line
				entry ?? cg.module.ref.null(binaryen.getTypeFromHeapType(cg.typeRegistry.get('DictEntry')!, true)),
			)),
			cg.module.struct.new([
				new BinVect(cg.module, bigint_to_i64(cg.module, BigInt(this.props.size))).vect,
				cg.module.local.get(internalarray_idx, t_dict_internal),
			], t_dict),
		], t_dict);
	}
}
