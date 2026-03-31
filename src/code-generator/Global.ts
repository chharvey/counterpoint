import * as assert from 'node:assert';
import binaryen from 'binaryen';
import {bigint_to_i64} from '../index.ts';



/**
 * A class modeling the Binaryen `module.global` instructions.
 */
export class Global {
	/* The Binaryen value of the variable. */
	#value: binaryen.ExpressionRef;

	/** The Binaryen type of the variable. */
	public readonly type: binaryen.Type;

	/** Whether the variable is mutable. */
	public readonly mut: boolean;

	/**
	 * Construct a new Global object.
	 * @param module A Binaryen module to send instructions to.
	 * @param name   The variable’s WASM name.
	 * @param value  The Binaryen value of the variable.
	 * @param typ    The Binaryen type of the variable.
	 * @param mut    Whether the variable is mutable.
	 */
	public constructor(
		private readonly module: binaryen.Module,
		public  readonly name:   string,
		value: binaryen.ExpressionRef,
		typ?:  binaryen.Type,
		mut?:  boolean,
	) {
		this.#value    = value;
		this.type      = typ ?? binaryen.getExpressionType(value);
		this.mut = mut ?? false;
	}

	/* The Binaryen value of the variable. */
	public get value(): binaryen.ExpressionRef {
		return this.#value;
	}

	public init(): binaryen.GlobalRef {
		return this.module.addGlobal(this.name, this.type, this.mut, this.#value);
	}

	public set(value: binaryen.ExpressionRef): binaryen.ExpressionRef {
		if (!this.mut) {
			throw new Error('Cannot set an immutable global!');
		}
		this.#value = value;
		return this.module.global.set(this.name, this.#value);
	}

	public get(): binaryen.ExpressionRef {
		return this.module.global.get(this.name, this.type);
	}

	/**
	 * Increments this Global’s value by 1.
	 * ```
	 * (global.set $this (.add (global.get $this) (.const 1)))
	 * ```
	 * This Global must be an i32 or i64.
	 */
	public inc(): binaryen.ExpressionRef {
		return this.set(this.type === binaryen.i32
			? this.module.i32.add(this.get(), this.module.i32.const(1))
			: (assert.strictEqual(this.type, binaryen.i64), this.module.i64.add(this.get(), bigint_to_i64(this.module, 1n))));
	}

	/**
	 * Places this Global’s value on the stack, but then increments it by 1 afterward.
	 * Equivalent to `i++` in most imperative languages.
	 * ```
	 * (block
	 * 	(global.get $this)
	 * 	(global.set $this (.add (global.get $this) (.const 1)))
	 * )
	 * ```
	 */
	public plusPlus(): binaryen.ExpressionRef {
		return this.module.block(null, [this.get(), this.inc()], this.type);
	}
}
