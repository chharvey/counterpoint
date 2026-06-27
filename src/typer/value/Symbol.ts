import type binaryen from 'binaryen';
import {
	bigint_to_i64,
	type CodeGenerator,
} from '../../index.ts';
import {
	noopMethod,
	memoizeMethod,
} from '../../lib/index.ts';
import {TYPE} from '../index.ts';
import {
	strictEqual,
	instanceOf,
	memoizeBinOp,
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
	@noopMethod(memoizeBinOp(true, true))
	@instanceOf(() => ValueSymbol)
	public override identical(value: Value): boolean {
		return this.id === (value as ValueSymbol).id;
	}

	@memoizeMethod
	public override toType(): TYPE.Unit<this> {
		// @ts-expect-error --- this class is final, so type `this` will always be type `ValueSymbol`
		return this.id === 0x80n ? TYPE.SYM_NOTHING : super.toType();
	}

	@memoizeMethod
	public override codegen(cg: CodeGenerator): binaryen.ExpressionRef {
		return cg.vm.Value.newPrimitive(cg.vm.Vect.newNat(bigint_to_i64(cg.mod, this.id, true)));
	}
}
export {ValueSymbol as Symbol};
