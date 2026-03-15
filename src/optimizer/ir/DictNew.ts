import type binaryen from 'binaryen';
import * as xjs from 'extrajs';
import {
	Property_new,
	type Builder,
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
			const entry: binaryen.ExpressionRef = Property_new(cg, id, value.codegen(cg));
			/**
			 * Find a bucket in which to place the entry.
			 * By default this will have index `id mod COUNT`,
			 * but in the case of collisions we will use the *linear probing* technique.
			 * @see https://en.wikipedia.org/wiki/Linear_probing
			 */
			function write_entry(index: number): void {
				if (entries[index]) {
					return write_entry((index + 1) % capacity);
				}
				entries[index] = entry;
			}
			return write_entry(Number(id) % capacity);
		});

		return cg.module.struct.new([
			cg.module.i32.const(this.props.size),
			cg.module.array.new_fixed(
				cg.getHeapType('$DictInternal')!,
				// `entries` is sparse, so spreading it resolves all the “empty” slots to `undefined`
				[...entries].map((entry) => entry ?? cg.module.ref.null(cg.getRefType('(ref null $Property)')!)),
			),
		], cg.getHeapType('$Dict')!);
	}
}
