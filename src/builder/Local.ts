import binaryen from 'binaryen';
import type {SymbolSchemaVar} from '../validator/index.ts';
import type {Temp} from '../optimizer/index.ts';



/**
 * A class modeling the Binaryen `module.local` instructions.
 */
export class Local {
	/* The Binaryen value of the variable. */
	#value: binaryen.ExpressionRef;

	/** The Binaryen type of the variable. */
	public readonly type: binaryen.Type;

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
		typ?:  binaryen.Type,
		public readonly schema?: SymbolSchemaVar | Temp,
	) {
		this.#value = value;
		this.type   = typ ?? binaryen.getExpressionType(value);
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
}
