import {memoizeMethod} from '../lib/index.ts';
import {
	type CplConfig,
	CONFIG_DEFAULT,
} from '../core/index.ts';
import {AST} from '../validator/index.ts';
import {
	Builder,
	Interpreter,
} from '../builder/index.ts';
import {CodeGenerator} from '../code-generator/index.ts';



export class Program {
	/** An AST goal produced by a Decorator. */
	readonly #astGoal: AST.Goal;


	/**
	 * Construct a new Program object.
	 * @param source - the source text
	 * @param config - The configuration settings for an instance program.
	 */
	public constructor(source: string, config: CplConfig = CONFIG_DEFAULT) {
		this.#astGoal = AST.Goal.fromSource(source, config);
	}

	@memoizeMethod
	#build(): Builder {
		const builder = new Builder();
		this.#astGoal.varCheck();
		this.#astGoal.typeCheck();
		this.#astGoal.build(builder);
		return builder;
	}

	@memoizeMethod
	#precompile(): CodeGenerator {
		const cg = new CodeGenerator();
		cg.setupMain(this.#build().codegen(cg));
		return cg;
	}

	public interpret(): void {
		return this.#build().interpret(new Interpreter());
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
