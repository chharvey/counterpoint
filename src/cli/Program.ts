import {
	type CplConfig,
	CONFIG_DEFAULT,
} from '../core/index.ts';
import {AST} from '../validator/index.ts';



export class Program {
	/** An AST goal produced by a Decorator. */
	readonly #astGoal: AST.Goal;

	#prebuilt = false;


	/**
	 * Construct a new Program object.
	 * @param source - the source text
	 * @param config - The configuration settings for an instance program.
	 */
	public constructor(source: string, config: CplConfig = CONFIG_DEFAULT) {
		this.#astGoal = AST.Goal.fromSource(source, config);
	}


	#prebuild(): void {
		if (!this.#prebuilt) { // TODO: use a run-once memoizer decorator
			this.#astGoal.varCheck();
			this.#astGoal.typeCheck();
			this.#astGoal.build();
			this.#prebuilt = true;
		}
	}

	/**
	 * Return the instructions to print to file.
	 * @return a readable text output in WAT format, to be compiled into WASM
	 */
	public print(): string {
		this.#prebuild();
		return this.#astGoal.builder.module.emitText();
	}

	/**
	 * Return a binary format of the program.
	 * @return a binary output in WASM format, which can be executed
	 */
	public compile(): Uint8Array {
		this.#prebuild();
		return this.#astGoal.builder.module.emitBinary();
	}
}
