import binaryen from 'binaryen';
import * as fs from 'fs'
import * as path from 'path'
import {
	SolidConfig,
	CONFIG_DEFAULT,
	AST,
} from './package.js';



type Local = {
	readonly id:   bigint,
	readonly type: binaryen.Type,
};

const DIRNAME = path.dirname(new URL(import.meta.url).pathname);

/**
 * The Builder generates assembly code.
 */
export class Builder {
	private static readonly IMPORTS: readonly string[] = [
		fs.readFileSync(path.join(DIRNAME, '../../src/builder/not.wat'), 'utf8'),
		fs.readFileSync(path.join(DIRNAME, '../../src/builder/emp.wat'), 'utf8'),
		fs.readFileSync(path.join(DIRNAME, '../../src/builder/neg.wat'), 'utf8'),
		fs.readFileSync(path.join(DIRNAME, '../../src/builder/exp.wat'), 'utf8'),
		fs.readFileSync(path.join(DIRNAME, '../../src/builder/fid.wat'), 'utf8'),
	]

	/**
	 * Create an `Either<L, R>` monad type structure.
	 * The Either monad has two sides, and a field that indicates the active side.
	 * @param left  the left  side type
	 * @param right the right side type
	 * @return      a Binaryen 3-tuple type of `[is_right: 0 | 1, left, right]`
	 */
	public static createBinTypeEither(left: binaryen.Type, right: binaryen.Type): binaryen.Type {
		return binaryen.createType([binaryen.i32, left, right]);
	}

	/**
	 * Create an instance of the `Either<L, R>` monad.
	 * @param mod      a module to create the instance in
	 * @param is_right is the active side the right-hand side?
	 * @param left     the left  side value
	 * @param right    the right side value
	 * @return         a Binaryen 3-tuple value of `[is_right: 0 | 1, left, right]`
	 */
	public static createBinEither(
		mod:      binaryen.Module,
		is_right: boolean,
		left:     binaryen.ExpressionRef,
		right:    binaryen.ExpressionRef,
	): binaryen.ExpressionRef {
		return mod.tuple.make([mod.i32.const(Number(is_right)), left, right]);
	}


	/** An AST goal produced by a Decorator. */
	private readonly ast_goal: AST.ASTNodeGoal;
	/**
	 * A counter for internal variables.
	 * Used for optimizing short-circuited expressions.
	 * Starts at a low negative number so as not to conflict with ‘real’ varible ids.
	 */
	private _varCount: bigint = -0x40n;
	/** A setlist containing ids of local variables. */
	private readonly locals: Local[] = [];
	/** The Binaryen module to build upon building. */
	public readonly module: binaryen.Module = binaryen.parseText(`
		(module
			${ Builder.IMPORTS.join('') }
		)
	`);


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
		return this._varCount++;
	}

	/**
	 * Add a local variable.
	 * If the variable has already been added, do nothing.
	 * If the variable is added, return the new index.
	 * @param id the id of the variable to add
	 * @return : [`this`, Was the operation performed?]
	 */
	public addLocal(id: bigint, type: binaryen.Type): [this, boolean] {
		let did: boolean = false;
		if (!this.locals.find((var_) => var_.id === id)) {
			this.locals.push({id, type});
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
		const found = this.locals.find((var_) => var_.id === id);
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
		return !!this.locals.find((var_) => var_.id === id);
	}

	/**
	 * Get the index of the given local in this Builder’s list, if it’s been added; else, return `null`.
	 * @param id the local whose index to get
	 * @return the index or `null`
	 */
	public getLocalInfo(id: bigint): {index: number, type: binaryen.Type} | null {
		const found = this.locals.find((var_) => var_.id === id);
		return (found)
			? {
				index: this.locals.indexOf(found),
				type:  found.type,
			}
			: null;
	}

	/**
	 * Return a copy of a list of this Builder’s local variables.
	 * @return the local variables in an array
	 */
	public getLocals(): Local[] {
		return [...this.locals];
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
	 * Prepare this builder.
	 * @return `this`
	 */
	public build(): this {
		this.module.setFeatures(binaryen.Features.Multivalue);
		this.ast_goal.build(this);
		const validation: number = this.module.validate();
		if (!validation) {
			throw new Error('Invalid WebAssembly module.');
		}
		return this;
	}

	/**
	 * Return the instructions to print to file.
	 * @return a readable text output in WAT format, to be compiled into WASM
	 */
	print(): string {
		return this.module.emitText();
	}

	/**
	 * Return a binary format of the program.
	 * @return a binary output in WASM format, which can be executed
	 */
	public compile(): Uint8Array {
		return this.module.emitBinary();
	}
}
