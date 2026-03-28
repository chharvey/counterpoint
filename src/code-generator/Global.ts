import binaryen from 'binaryen';



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
}
