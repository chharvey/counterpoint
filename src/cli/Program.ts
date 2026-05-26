import {memoizeMethod} from '../lib/index.ts';
import {
	type CplConfig,
	CONFIG_DEFAULT,
} from '../core/index.ts';
import {AST} from '../validator/index.ts';
import {Builder} from '../optimizer/index.ts';
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
	#precompile(): CodeGenerator {
		const optimizer = new Builder();
		const cg        = new CodeGenerator();

		this.#astGoal.varCheck();
		this.#astGoal.typeCheck();
		this.#astGoal.build(optimizer);

		cg.setupMain(optimizer.codegen(cg));

		return cg;
	}

	/**
	 * Return the instructions to print to file.
	 * @return a readable text output in WAT format, to be compiled into WASM
	 */
	public print(): string {
		return this.#precompile().vm.mod.emitText();
	}

	/**
	 * Return a binary format of the program.
	 * @return a binary output in WASM format, which can be executed
	 */
	public compile(): Uint8Array {
		return this.#precompile().vm.mod.emitBinary();
	}
}
