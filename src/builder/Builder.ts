import binaryen from 'binaryen';
import * as fs from 'fs'
import * as path from 'path'
import type { NonemptyArray } from '../lib/index.js';
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
	 * Create a structure containing one of many possible types.
	 * See {@link Builder.createBinEither} for details.
	 * @param  types        the binaryen types
	 * @return              a Binaryen n-tuple type of `[i32, i32, ...types]`
	 * @throws {RangeError} if the given array does not have a length of a power of 2
	 */
	public static createBinTypeEither(types: Readonly<NonemptyArray<binaryen.Type>>): binaryen.Type {
		if (Math.log2(types.length) % 1 !== 0) {
			throw new RangeError('The given array does not have a length of a power of 2.');
		}
		return binaryen.createType([binaryen.i32, binaryen.i32, ...types]);
		//                          ^             ^             ^ possible types
		//                          ^             ^ index of current type
		//                          ^ length of `types`
	}

	/**
	 * Create a structure containing one of many possible values.
	 *
	 * The values are represented as leaves in a binary tree that is “perfect”
	 * (i.e., all leaves are at the same depth level).
	 * What this means is that the number of leaves is always a power of 2,
	 * and each leaf can be accessed by traversing the tree.
	 *
	 * For example, a variable could be one of the following values: *1, 2.0, 3.3, 4.4*.
	 * This data structure would be represented as a Binaryen tuple type with `n+2` entries,
	 * where `n` is the number of possible values, preceeded by 2 entires:
	 * the first of which indicates the “length”, or number of leaves, (in this case, 4), and
	 * the second of which indicates the “selection”, the index of the current actual value at runtime.
	 * If the current value is, say, *2.0* (with index 1), then this would be represented by the Binaryen tuple
	 * `[4, 1, 1, 2.0, 3.3, 4.4]`.
	 *
	 * @param  mod          a module to create the instance in
	 * @param  index        the index of the current value at runtime
	 * @param  values       the possible values
	 * @return              a Binaryen n-tuple value of `[values.length, index, ...values]`
	 * @throws {RangeError} if the given array does not have a length of a power of 2
	 */
	public static createBinEither(
		mod:    binaryen.Module,
		index:  bigint | binaryen.ExpressionRef,
		values: Readonly<NonemptyArray<binaryen.ExpressionRef>>,
	): binaryen.ExpressionRef {
		if (Math.log2(values.length) % 1 !== 0) {
			throw new RangeError('The given array does not have a length of a power of 2.');
		}
		if (typeof index === 'bigint') {
			index = mod.i32.const(Number(index));
		}
		return mod.tuple.make([mod.i32.const(values.length), index, ...values]);
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
