import type binaryen from 'binaryen';
import {
	type Builder,
	BinVect,
} from '../../index.ts';
import {
	strictEqual,
	instanceOf,
} from '../utils-private.ts';
import type {Value} from './Value.ts';
import {Primitive} from './Primitive.ts';



/**
 * Symbol values are opaque constant value types that are only referenceable and comparable by name.
 *
 * (Not to be confused with ‘symbols’ in a Validator’s symbol table,
 * which represent declared types and variables in a program.)
 *
 * Symbols are implemented as simple integers at runtime,
 * but they are not exposed as such to the programmer.
 * @final
 */
class ValueSymbol extends Primitive {
	/**
	 * Construct a new ValueSymbol object.
	 * @param id An internal ID used to identify unique symbols.
	 * @param name A human-friendly name identifying the symbol.
	 * 	Symbols with different IDs *should not* have the same name,
	 * 	but accidents can happen. Use `id`, not `name`, to identify symbols.
	 */
	public constructor(
		public  readonly id:   bigint,
		private readonly name: string,
	) {
		super();
	}

	public override toString(): string {
		return `@${ this.name }`;
	}

	public override get isTruthy(): boolean {
		return true;
	}

	@strictEqual
	@instanceOf(() => ValueSymbol)
	// @memoizeBinOp(true, true) // memoizing takes longer than a simple comparison
	public override identical(value: Value): boolean {
		return this.id === (value as ValueSymbol).id;
	}

	public override build(builder: Builder): binaryen.ExpressionRef {
		return new BinVect(builder.module, builder.module.i32.const(Number(this.id))).vect;
	}
}
export {ValueSymbol as Symbol};
