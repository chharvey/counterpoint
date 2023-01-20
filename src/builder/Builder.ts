import * as fs from 'fs'
import * as path from 'path'
import wabt from 'wabt'; // need `tsconfig.json#compilerOptions.allowSyntheticDefaultImports = true`
import {
	SolidConfig,
	CONFIG_DEFAULT,
	AST,
} from './package.js';



const DIRNAME = path.dirname(new URL(import.meta.url).pathname);

/**
 * The Builder generates assembly code.
 */
export class Builder {
	static readonly IMPORTS: readonly string[] = [
		fs.readFileSync(path.join(DIRNAME, '../../src/builder/not.wat'), 'utf8'),
		fs.readFileSync(path.join(DIRNAME, '../../src/builder/emp.wat'), 'utf8'),
		fs.readFileSync(path.join(DIRNAME, '../../src/builder/neg.wat'), 'utf8'),
		fs.readFileSync(path.join(DIRNAME, '../../src/builder/exp.wat'), 'utf8'),
		fs.readFileSync(path.join(DIRNAME, '../../src/builder/fid.wat'), 'utf8'),
	]


	/** An AST goal produced by a Decorator. */
	private readonly ast_goal: AST.ASTNodeGoal;
	/** A counter for internal variables. Used for optimizing short-circuited expressions. */
	private var_count: bigint = 0n

	/** A setlist containing ids of local variables. */
	private locals: Array<{id: bigint, isFloat: boolean}> = [];

	/**
	 * Construct a new Builder object.
	 * @param source - the source text
	 * @param config - The configuration settings for an instance program.
	 */
	constructor (source: string, config: SolidConfig = CONFIG_DEFAULT) {
		this.ast_goal  = AST.ASTNodeGoal.fromSource(source, config);
		this.ast_goal.varCheck (); // assert does not throw
		this.ast_goal.typeCheck(); // assert does not throw
	}

	/**
	 * Return this Builder’s short-circuit variable count, and then increment it.
	 * @return this Builder’s current variable counter
	 */
	get varCount(): bigint {
		return this.var_count++
	}

	/**
	 * Add a local variable.
	 * If the variable has already been added, do nothing.
	 * If the variable is added, return the new index.
	 * @param id the id of the variable to add
	 * @return : [`this`, Was the operation performed?]
	 */
	public addLocal(id: bigint, is_float: boolean): [this, boolean] {
		let did: boolean = false;
		if (!this.locals.find((v) => v.id === id)) {
			this.locals.push({id, isFloat: is_float});
			did = true;
		}
		return [this, did];
	}

	/**
	 * Remove a local variable.
	 * If the local variable doesn’t exist, do nothing.
	 * @param id the id of the variable to remove
	 * @return [`this`, Was the operation performed?]
	 */
	public removeLocal(id: bigint): [this, boolean] {
		let did = false;
		const found = this.locals.find((v) => v.id === id);
		if (found) {
			this.locals.splice(this.locals.indexOf(found), 1);
			did = true;
		}
		return [this, did];
	}

	/**
	 * Check whether this Builder’s setlist of locals has the given id.
	 * @param id the id to check
	 * @return Does the setlist of locals include the id?
	 */
	public hasLocal(id: bigint): boolean {
		return !!this.locals.find((v) => v.id === id);
	}

	/**
	 * Get the index of the given local in this Builder’s list, if it’s been added; else, return `null`.
	 * @param id the local whose index to get
	 * @return the index or `null`
	 */
	public getLocalInfo(id: bigint): {index: number, isFloat: boolean} | null {
		const found = this.locals.find((v) => v.id === id);
		return (found)
			? {
				index:   this.locals.indexOf(found),
				isFloat: found.isFloat,
			}
			: null;
	}

	/**
	 * Return a copy of a list of this Builder’s local variables.
	 * @return the local variables in an array
	 */
	public getLocals(): Map<bigint, boolean> {
		return new Map(this.locals.map((v) => [v.id, v.isFloat]));
	}

	/**
	 * Remove all local variables in this Builder.
	 * @return `this`
	 */
	public clearLocals(): this {
		this.locals.length = 0;
		return this;
	}

	/**
	 * Return the instructions to print to file.
	 * @return a readable text output in WAT format, to be compiled into WASM
	 */
	print(): string {
		return this.ast_goal.build(this).toString()
	}

	/**
	 * Return a binary format of the program.
	 * @return a binary output in WASM format, which can be executed
	 */
	async compile(): Promise<Uint8Array> {
		const waModule = (await wabt()).parseWat('', this.print(), {})
		waModule.validate()
		return waModule.toBinary({}).buffer
	}
}
