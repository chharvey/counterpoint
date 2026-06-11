import {
	memoizeMethod,
	type CPConfig,
	CONFIG_DEFAULT,
	AST,
	Optimizer,
	Builder,
} from './index.ts';



export class Program {
	/** An AST goal produced by a Decorator. */
	readonly #astGoal: AST.ASTNodeGoal;


	/**
	 * Construct a new Program object.
	 * @param source - the source text
	 * @param config - The configuration settings for an instance program.
	 */
	public constructor(source: string, config: CPConfig = CONFIG_DEFAULT) {
		this.#astGoal = AST.ASTNodeGoal.fromSource(source, config);
	}


	@memoizeMethod
	#precompile(): Builder {
		const optimizer = new Optimizer();
		const cg        = new Builder();

		this.#astGoal.varCheck();
		this.#astGoal.typeCheck();
		this.#astGoal.lower(optimizer);

		cg.setupMain(optimizer.codegen(cg));

		return cg;
	}

	/**
	 * Return the instructions to print to file.
	 * @return a readable text output in WAT format, to be compiled into WASM
	 */
	public print(): string {
		return this.#precompile().mod.emitText();
	}

	/**
	 * Return a binary format of the program.
	 * @return a binary output in WASM format, which can be executed
	 */
	public compile(): Uint8Array {
		return this.#precompile().mod.emitBinary();
	}
}
