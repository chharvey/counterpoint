import * as assert from 'node:assert';
import * as binaryen from 'binaryen.ts';
import type {SymbolSchemaVar} from '../validator/index.ts';
import type {Temp} from '../optimizer/index.ts';



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
	 * @param schema The compiler’s internal data for a declared variable or an optimizer temporary.
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
		return this.module.wasm.local.set(this.index, this.#value);
	}

	public get(): binaryen.ExpressionRef {
		return this.module.wasm.local.get(this.index, this.type);
	}

	public tee(value?: binaryen.ExpressionRef): binaryen.ExpressionRef {
		if (value !== undefined) {
			this.#value = value;
		}
		return this.module.wasm.local.tee(this.index, this.#value, this.type);
	}

	/**
	 * Increments this Local’s value by 1.
	 * ```
	 * (local.set $this (.add (local.get $this) (.const 1)))
	 * ```
	 * This Local must be an i32 or i64.
	 */
	public inc(): binaryen.ExpressionRef {
		const {wasm} = this.module;
		return this.set(this.type === binaryen.i32
			? wasm.i32.add(this.get(), wasm.i32.const(1))
			: (assert.strictEqual(this.type, binaryen.i64), wasm.i64.add(this.get(), wasm.i64.const(1n))));
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
		const {wasm} = this.module;
		return wasm.block(null, [
			this.inc(),
			this.type === binaryen.i32
				? wasm.i32.sub(this.get(), wasm.i32.const(1))
				: (assert.strictEqual(this.type, binaryen.i64), wasm.i64.sub(this.get(), wasm.i64.const(1n))),
		], this.type);
	}
}
