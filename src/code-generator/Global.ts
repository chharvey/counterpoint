import * as binaryen from 'binaryen.ts';



/**
 * A class modeling the Binaryen `wasm.global.*` instructions.
 */
export class Global {
	/* The Binaryen value of the variable. */
	#value: binaryen.ExpressionRef;

	/**
	 * Construct a new Global object.
	 * @param wasm   A Binaryen module’s expression builder to send instructions to.
	 * @param name   The variable’s WASM name.
	 * @param init   The Binaryen initial value of the variable.
	 * @param type   The Binaryen type of the variable.
	 */
	public constructor(
		private readonly wasm: binaryen.ExpressionBuilder,
		public  readonly name: string,
		init: binaryen.ExpressionRef,
		public readonly type: binaryen.Type = binaryen.getExpressionType(init),
	) {
		this.#value = init;
	}

	/* The Binaryen value of the variable. */
	public get value(): binaryen.ExpressionRef {
		return this.#value;
	}

	public set(value?: binaryen.ExpressionRef): binaryen.ExpressionRef {
		if (value !== undefined) {
			this.#value = value;
		}
		return this.wasm.global.set(this.name, this.#value);
	}

	public get(): binaryen.ExpressionRef {
		return this.wasm.global.get(this.name, this.type);
	}

	public addToModule(mod: binaryen.Module, mutable: boolean = false): binaryen.GlobalRef {
		return mod.globals.add(this.name, this.type, mutable, this.#value);
	}

	public getFromModule(mod: binaryen.Module): binaryen.GlobalRef {
		return mod.globals.get(this.name);
	}
}
