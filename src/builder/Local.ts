import binaryen from 'binaryen';
import type {Builder} from './Builder.js';



/**
 * A class modeling the Binaryen `module.local` instructions.
 */
export class Local {
	/** A Binaryen module to send instructions to. */
	readonly #module: binaryen.Module;

	/** The variable’s WASM index. */
	readonly #index: number;

	/* The Binaryen value of the variable. */
	#value: binaryen.ExpressionRef;

	/** The Binaryen type of the variable. */
	public readonly type: binaryen.Type;

	/**
	 * Construct a new Local object.
	 * @param builder a builder to add the local variable to
	 * @param id      The compiler’s internal identifier for the variable.
	 * @param index   a WASM variable index
	 * @param value   The Binaryen value of the variable.
	 */
	public constructor(
		builder: Builder,
		public readonly id: bigint,
		index: number,
		value: binaryen.ExpressionRef,
	) {
		this.#module = builder.module;
		this.#index  = index;
		this.#value  = value;
		this.type    = binaryen.getExpressionType(value);
	}

	/* The Binaryen value of the variable. */
	public get value(): binaryen.ExpressionRef {
		return this.#value;
	}

	public set(value?: binaryen.ExpressionRef): binaryen.ExpressionRef {
		if (value !== undefined) {
			this.#value = value;
		}
		return this.#module.local.set(this.#index, this.#value);
	}

	public get(): binaryen.ExpressionRef {
		return this.#module.local.get(this.#index, this.type);
	}

	public tee(value?: binaryen.ExpressionRef): binaryen.ExpressionRef {
		if (value !== undefined) {
			this.#value = value;
		}
		return this.#module.local.tee(this.#index, this.#value, this.type);
	}
}
