import binaryen from 'binaryen';
import * as fs from 'fs'
import * as path from 'path'
import {
	SolidConfig,
	CONFIG_DEFAULT,
	AST,
} from './package.js';
import {BinVect} from './BinVect.js';



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
		fs.readFileSync(path.join(DIRNAME, '../../src/builder/exp.wat'), 'utf8'),
		fs.readFileSync(path.join(DIRNAME, '../../src/builder/fid.wat'), 'utf8'),
	]


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

	#binOpFunction(
		name:         string,
		permutations: (mod: binaryen.Module, vects: readonly [BinVect, BinVect]) => readonly binaryen.ExpressionRef[],
	): binaryen.FunctionRef {
		const vects = [0, 1].map((i) => new BinVect(this.module, this.module.local.get(i, binaryen.v128))) as readonly BinVect[] as readonly [BinVect, BinVect];
		const opts: readonly binaryen.ExpressionRef[] = permutations.call(null, this.module, vects);
		return this.module.addFunction(name, binaryen.createType([binaryen.v128, binaryen.v128]), binaryen.v128, [], this.module.block(null, [this.module.if(
			vects[0].isInt,
			this.module.if(vects[1].isInt, opts[0b00], opts[0b01]),
			this.module.if(vects[1].isInt, opts[0b10], opts[0b11]),
		)], binaryen.v128));
	}

	#setupFunctions(): void {
		this.module.addFunction('vnot', binaryen.v128, binaryen.v128, [], this.module.block(null, [
			((mod: binaryen.Module) => {
				const vect = new BinVect(mod, mod.local.get(0, binaryen.v128));
				return BinVect.asBool(mod, mod.i32.or(vect.isSpecial(null), vect.isSpecial(false)));
			})(this.module),
		], binaryen.v128));
		this.module.addFunction('vemp', binaryen.v128, binaryen.v128, [], this.module.block(null, [
			((mod: binaryen.Module) => {
				const vect = new BinVect(mod, mod.local.get(0, binaryen.v128));
				return mod.if(
					vect.isSpecial(),
					mod.call('vnot', [vect.vect], binaryen.v128),
					mod.if(
						vect.isInt,
						BinVect.asBool(mod, mod.i32.eqz(vect.intValue)),
						BinVect.asBool(mod, mod.f64.eq(vect.floatValue, mod.f64.const(0.0))), // also takes care of -0.0
					),
				);
			})(this.module),
		], binaryen.v128));
		this.module.addFunction('vneg', binaryen.v128, binaryen.v128, [], this.module.block(null, [
			((mod: binaryen.Module) => {
				const vect = new BinVect(mod, mod.local.get(0, binaryen.v128));
				return mod.if(
					vect.isInt,
					// `-n` in two’s complement is `(n xor -1) + 1`
					new BinVect(mod, mod.i32.add(mod.i32.xor(vect.intValue, mod.i32.const(-1)), mod.i32.const(1))).vect,
					new BinVect(mod, mod.f64.neg(vect.floatValue)).vect,
				);
			})(this.module),
		], binaryen.v128));
		this.#binOpFunction('vexp', (mod, vects) => [
			new BinVect(mod, mod.call('exp', [vects[0].intValue, vects[1].intValue], binaryen.i32)).vect,
			mod.unreachable(),
			mod.unreachable(),
			mod.unreachable(),
		]);
		this.#binOpFunction('vmul', (mod, vects) => [
			mod.i32.mul(                      vects[0].intValue,                         vects[1].intValue),
			mod.f64.mul(mod.f64.convert_u.i32(vects[0].intValue),                        vects[1].floatValue),
			mod.f64.mul(                      vects[0].floatValue, mod.f64.convert_u.i32(vects[1].intValue)),
			mod.f64.mul(                      vects[0].floatValue,                       vects[1].floatValue),
		].map((opt) => new BinVect(mod, opt).vect));
		this.#binOpFunction('vdiv', (mod, vects) => [
			mod.i32.div_s(                      vects[0].intValue,                         vects[1].intValue),
			mod.f64.div  (mod.f64.convert_u.i32(vects[0].intValue),                        vects[1].floatValue),
			mod.f64.div  (                      vects[0].floatValue, mod.f64.convert_u.i32(vects[1].intValue)),
			mod.f64.div  (                      vects[0].floatValue,                       vects[1].floatValue),
		].map((opt) => new BinVect(mod, opt).vect));
		this.#binOpFunction('vadd', (mod, vects) => [
			mod.i32.add(                      vects[0].intValue,                         vects[1].intValue),
			mod.f64.add(mod.f64.convert_u.i32(vects[0].intValue),                        vects[1].floatValue),
			mod.f64.add(                      vects[0].floatValue, mod.f64.convert_u.i32(vects[1].intValue)),
			mod.f64.add(                      vects[0].floatValue,                       vects[1].floatValue),
		].map((opt) => new BinVect(mod, opt).vect));
		this.#binOpFunction('vlt', (mod, vects) => [
			mod.i32.lt_s(                      vects[0].intValue,                         vects[1].intValue),
			mod.f64.lt  (mod.f64.convert_u.i32(vects[0].intValue),                        vects[1].floatValue),
			mod.f64.lt  (                      vects[0].floatValue, mod.f64.convert_u.i32(vects[1].intValue)),
			mod.f64.lt  (                      vects[0].floatValue,                       vects[1].floatValue),
		].map((opt) => BinVect.asBool(this.module, opt)));
		this.#binOpFunction('vgt', (mod, vects) => [
			mod.i32.gt_s(                      vects[0].intValue,                         vects[1].intValue),
			mod.f64.gt  (mod.f64.convert_u.i32(vects[0].intValue),                        vects[1].floatValue),
			mod.f64.gt  (                      vects[0].floatValue, mod.f64.convert_u.i32(vects[1].intValue)),
			mod.f64.gt  (                      vects[0].floatValue,                       vects[1].floatValue),
		].map((opt) => BinVect.asBool(this.module, opt)));
		this.#binOpFunction('vle', (mod, vects) => [
			mod.i32.le_s(                      vects[0].intValue,                         vects[1].intValue),
			mod.f64.le  (mod.f64.convert_u.i32(vects[0].intValue),                        vects[1].floatValue),
			mod.f64.le  (                      vects[0].floatValue, mod.f64.convert_u.i32(vects[1].intValue)),
			mod.f64.le  (                      vects[0].floatValue,                       vects[1].floatValue),
		].map((opt) => BinVect.asBool(this.module, opt)));
		this.#binOpFunction('vge', (mod, vects) => [
			mod.i32.ge_s(                      vects[0].intValue,                         vects[1].intValue),
			mod.f64.ge  (mod.f64.convert_u.i32(vects[0].intValue),                        vects[1].floatValue),
			mod.f64.ge  (                      vects[0].floatValue, mod.f64.convert_u.i32(vects[1].intValue)),
			mod.f64.ge  (                      vects[0].floatValue,                       vects[1].floatValue),
		].map((opt) => BinVect.asBool(this.module, opt)));
		this.module.addFunction('vid', binaryen.createType([binaryen.v128, binaryen.v128]), binaryen.v128, [], this.module.block(null, [((mod: binaryen.Module) => {
			const vects = [0, 1].map((i) => new BinVect(this.module, this.module.local.get(i, binaryen.v128))) as readonly BinVect[] as readonly [BinVect, BinVect];
			return mod.if(
				mod.i32.and(vects[0].isSpecial(), vects[1].isSpecial()),
				BinVect.asBool(mod, mod.i32.eq(
					mod.i16x8.extract_lane_s(vects[0].vect, 3), // TODO: hide thie implementation detail
					mod.i16x8.extract_lane_s(vects[1].vect, 3), // TODO: hide thie implementation detail
				)),
				mod.if(
					mod.i32.and(vects[0].isInt, vects[1].isInt),
					BinVect.asBool(mod, mod.i32.eq(vects[0].intValue, vects[1].intValue)), // `i32.eq` for ints gives the same result as `ID` operator
					mod.if(
						mod.i32.and(vects[0].isFloat, vects[1].isFloat),
						BinVect.asBool(mod, mod.call('fid', [vects[0].floatValue, vects[1].floatValue], binaryen.i32)),
						new BinVect(mod, false).vect,
					),
				),
			);
		})(this.module)], binaryen.v128));
		this.module.addFunction('veq', binaryen.createType([binaryen.v128, binaryen.v128]), binaryen.v128, [], this.module.block(null, [((mod: binaryen.Module) => {
			const vects = [0, 1].map((i) => new BinVect(this.module, this.module.local.get(i, binaryen.v128))) as readonly BinVect[] as readonly [BinVect, BinVect];
			const opts = [
				mod.i32.eq(                      vects[0].intValue,                         vects[1].intValue),
				mod.f64.eq(mod.f64.convert_u.i32(vects[0].intValue),                        vects[1].floatValue),
				mod.f64.eq(                      vects[0].floatValue, mod.f64.convert_u.i32(vects[1].intValue)),
				mod.f64.eq(                      vects[0].floatValue,                       vects[1].floatValue),
			].map((opt) => BinVect.asBool(mod, opt));
			return mod.if(
				mod.i32.or(vects[0].isSpecial(), vects[1].isSpecial()),
				mod.call('vid', vects.map((v) => v.vect), binaryen.v128),
				mod.if(
					vects[0].isInt,
					mod.if(vects[1].isInt, opts[0b00], opts[0b01]),
					mod.if(vects[1].isInt, opts[0b10], opts[0b11]),
				),
			);
		})(this.module)], binaryen.v128));
		// equality, but with int coercion turned off (equating ints with floats always returns false)
		this.module.addFunction('veqq', binaryen.createType([binaryen.v128, binaryen.v128]), binaryen.v128, [], this.module.block(null, [((mod: binaryen.Module) => {
			const vects = [0, 1].map((i) => new BinVect(this.module, this.module.local.get(i, binaryen.v128))) as readonly BinVect[] as readonly [BinVect, BinVect];
			const opts = [
				mod.i32.eq(vects[0].intValue, vects[1].intValue),
				this.module.i32.const(0),
				this.module.i32.const(0),
				mod.f64.eq(vects[0].floatValue, vects[1].floatValue),
			].map((opt) => BinVect.asBool(mod, opt));
			return mod.if(
				mod.i32.or(vects[0].isSpecial(), vects[1].isSpecial()),
				mod.call('vid', vects.map((v) => v.vect), binaryen.v128),
				mod.if(
					vects[0].isInt,
					mod.if(vects[1].isInt, opts[0b00], opts[0b01]),
					mod.if(vects[1].isInt, opts[0b10], opts[0b11]),
				),
			);
		})(this.module)], binaryen.v128));
	}

	/**
	 * Prepare this builder.
	 * @return `this`
	 */
	public build(): this {
		this.module.setFeatures( // NOTE: features are bit tags; to add them we must use bit-wise disjunction
			  binaryen.Features.ReferenceTypes
			| binaryen.Features.SIMD128
			| binaryen.Features.Multivalue
		);
		this.#setupFunctions();
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
