import * as assert from 'node:assert';
import binaryen from 'binaryen';
import type {SymbolSchemaVar} from '../validator/index.ts';
import type {Temp} from '../builder/index.ts';
import {bigint_to_i64} from './utils-public.ts';



/**
 * A class modeling the Binaryen `module.local` instructions.
 */
export class Local {
	/* The Binaryen value of the variable. */
	#value: binaryen.ExpressionRef;

	/**
	 * Construct a new Local object.
	 * @param module A Binaryen module to send instructions to.
	 * @param index  The variable’s WASM index.
	 * @param value  The Binaryen value of the variable.
	 * @param typ    The Binaryen type of the variable.
	 * @param schema The compiler’s internal data for a declared variable or a Builder temporary.
	 */
	public constructor(
		private readonly module: binaryen.Module,
		private readonly index:  number,
		value: binaryen.ExpressionRef,
		public readonly type:    binaryen.Type = binaryen.getExpressionType(value),
		public readonly schema?: SymbolSchemaVar | Temp,
	) {
		this.#value = value;
	}

	/* The Binaryen value of the variable. */
	public get value(): binaryen.ExpressionRef {
		return this.#value;
	}

	public set(value?: binaryen.ExpressionRef): binaryen.ExpressionRef {
		if (value !== undefined) {
			this.#value = value;
		}
		return this.module.local.set(this.index, this.#value);
	}

	public get(): binaryen.ExpressionRef {
		return this.module.local.get(this.index, this.type);
	}

	public tee(value?: binaryen.ExpressionRef): binaryen.ExpressionRef {
		if (value !== undefined) {
			this.#value = value;
		}
		return this.module.local.tee(this.index, this.#value, this.type);
	}

	/**
	 * Increments this Local’s value by 1.
	 * ```
	 * (local.set $this (.add (local.get $this) (.const 1)))
	 * ```
	 * This Local must be an i32 or i64.
	 */
	public inc(): binaryen.ExpressionRef {
		return this.set(this.type === binaryen.i32
			? this.module.i32.add(this.get(), this.module.i32.const(1))
			: (assert.strictEqual(this.type, binaryen.i64), this.module.i64.add(this.get(), bigint_to_i64(this.module, 1n))));
	}

	/**
	 * Increments this Local’s value, but then returns its value minus 1 afterward.
	 * Equivalent to `i++` in most imperative languages.
	 * ```
	 * (block (result <$this.type>)
	 * 	(local.set $this (.add (local.get $this) (.const 1)))
	 * 	(.sub (local.get $this) (.const 1))
	 * )
	 * ```
	 */
	public plusPlus(): binaryen.ExpressionRef {
		return this.module.block(null, [
			this.inc(),
			this.type === binaryen.i32
				? this.module.i32.sub(this.get(), this.module.i32.const(1))
				: (assert.strictEqual(this.type, binaryen.i64), this.module.i64.sub(this.get(), bigint_to_i64(this.module, 1n))),
		], this.type);
	}
}
