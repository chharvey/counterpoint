import * as fs from 'node:fs';
import * as path from 'node:path';
import binaryen from 'binaryen';
import {Local} from './Local.ts';
import {BinVect} from './BinVect.ts';
import type {
	BinaryenModuleUpdates,
	TypeBuilder,
} from './-types.d.ts';



/** Schema of WASM local variable info. */
type LocalInfo = {
	/** WASM local index. */
	readonly index: number,
	/** Binaryen type. */
	readonly type:  number,
};



/**
 * The Builder generates assembly code.
 */
export class Builder {
	private static readonly IMPORTS: readonly string[] = [
		fs.readFileSync(path.join(import.meta.dirname, '../../src/builder/exp.wat'), 'utf8'),
		fs.readFileSync(path.join(import.meta.dirname, '../../src/builder/fid.wat'), 'utf8'),
	];


	/**
	 * A counter for internal variables.
	 * Used for optimizing short-circuited expressions.
	 * Starts at a low negative number so as not to conflict with ‘real’ varible ids.
	 */
	#varCount: bigint = -0x40n;

	/** Tracking WASM local indices. */
	#localCount: bigint = 0n;

	/** A lookup table from variable ids to WASM local variable info. */
	readonly #localTable = new Map<bigint, LocalInfo>();

	#typeCount: bigint = 0n;

	/** A setlist containing ids of local variables. */
	private readonly locals: Local[] = [];

	/** The Binaryen module to build upon building. */
	public readonly module: BinaryenModuleUpdates = binaryen.parseText(`
		(module
			${ Builder.IMPORTS.join('') }
		)
	`) as BinaryenModuleUpdates;

	// @ts-expect-error --- WASM 3.0 (incl. GC) not typed yet
	// eslint-disable-next-line
	public readonly typeBuilder: TypeBuilder = new binaryen.TypeBuilder();


	public nextTypeIndex(): bigint {
		return this.#typeCount++;
	}

	/**
	 * Return a WASM `(local.set)` instruction. Generates its own WASM variable index.
	 * @param id    a validator’s variable id or an IR temporary local id, which identifies the symbol to be written to
	 * @param value a Binaryen value to assign to the variable
	 * @return      `(local.set ‹index› ‹value›)`
	 */
	public localSet(id: bigint, value: binaryen.ExpressionRef): binaryen.ExpressionRef {
		this.#localTable.has(id) || this.#localTable.set(id, {index: Number(this.#localCount++), type: binaryen.getExpressionType(value)});
		return this.module.local.set(this.#localTable.get(id)!.index, value);
	}

	/**
	 * Return a WASM `(local.get)` instruction.
	 * @param id a validator’s variable id or an IR temporary local id, which identifies the symbol to be read
	 * @return   `(local.get ‹index›)`
	 */
	public localGet(id: bigint): binaryen.ExpressionRef {
		const local_info: LocalInfo | undefined = this.#localTable.get(id);
		if (!local_info) {
			throw new ReferenceError(`Local with id \`${ id }\` must be set first!`);
		}
		return this.module.local.get(local_info.index, local_info.type);
	}

	/**
	 * Add a new local variable.
	 * @param value the binaryen value of the variable to add
	 * @return      [`this`, the new local variable]
	 */
	public addLocal(value: binaryen.ExpressionRef): [this, Local] {
		const local = new Local(this.module, this.#varCount++, this.locals.length, value);
		this.locals.push(local);
		return [this, local];
	}

	/**
	 * Set a local variable, given a variable id.
	 * If a variable with that id has already been added, do nothing.
	 * @param id    the id of the variable to set
	 * @param value the binaryen value of the variable to set
	 * @return      [`this`, Was the operation performed?]
	 */
	public setLocal(id: bigint, value: binaryen.ExpressionRef): [this, boolean] {
		let did: boolean = false;
		if (!this.hasLocal(id)) {
			this.locals.push(new Local(this.module, id, this.locals.length, value));
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
		const found = this.getLocal(id);
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
		return !!this.getLocal(id);
	}

	/**
	 * Get the local with the given id in this Builder’s list, if it’s been added; else, return `null`.
	 * @param  id the id of the local to get
	 * @return    the local or `null`
	 */
	public getLocal(id: bigint): Local | null {
		return this.locals.find((var_) => var_.id === id) ?? null;
	}

	/**
	 * Set a local variable to the given id and return it.
	 * If a variable with that id has already been added, this Builder’s state is not changed.
	 * @param id    the id of the variable to set
	 * @param value the binaryen value of the variable to set
	 * @return      the local variable set (or retreived)
	 */
	public teeLocal(id: bigint, value: binaryen.ExpressionRef): Local {
		return this.setLocal(id, value)[0].getLocal(id)!;
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
		this.module.addFunction('vnot', binaryen.v128, binaryen.v128, [], this.module.block(null, [((mod: binaryen.Module) => {
			const vect = new BinVect(mod, mod.local.get(0, binaryen.v128));
			return BinVect.asBool(mod, mod.i32.or(vect.isSpecial(null), vect.isSpecial(false)));
		})(this.module)], binaryen.v128));
		this.module.addFunction('vemp', binaryen.v128, binaryen.v128, [], this.module.block(null, [((mod: binaryen.Module) => {
			const vect = new BinVect(mod, mod.local.get(0, binaryen.v128));
			return mod.if(
				vect.isSpecial(),
				mod.call('vnot', [vect.vect], binaryen.v128),
				mod.if(
					vect.isInt,
					BinVect.asBool(mod, mod.i32.eqz(vect.intValue)),
					mod.if(
						vect.isFloat,
						BinVect.asBool(mod, mod.f64.eq(vect.floatValue, mod.f64.const(0.0))), // also takes care of -0.0
						BinVect.asBool(mod, mod.i32.and(vect.isAddr, mod.i32.eqz(vect.addrValue))),
					),
				),
			);
		})(this.module)], binaryen.v128));
		this.module.addFunction('vneg', binaryen.v128, binaryen.v128, [], this.module.block(null, [((mod: binaryen.Module) => {
			const vect = new BinVect(mod, mod.local.get(0, binaryen.v128));
			return mod.if(
				vect.isInt,
				// `-n` in two’s complement is `(n xor -1) + 1`
				new BinVect(mod, mod.i32.add(mod.i32.xor(vect.intValue, mod.i32.const(-1)), mod.i32.const(1))).vect,
				new BinVect(mod, mod.f64.neg(vect.floatValue)).vect,
			);
		})(this.module)], binaryen.v128));
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
	}

	/**
	 * Prepare this builder’s module, with optional additional actions/modifications.
	 * @param main a callback to run after setup but before validation
	 */
	public setupModule(main?: (mod: binaryen.Module) => void): void {
		this.module.setFeatures(( // NOTE: features are bit tags; to add them we must use bit-wise disjunction
			/* eslint-disable @stylistic/operator-linebreak */
			binaryen.Features.SIMD128 |
			binaryen.Features.ReferenceTypes |
			binaryen.Features.Multivalue |
			binaryen.Features.GC
			/* eslint-enable @stylistic/operator-linebreak */
		));
		this.#setupFunctions();
		main?.call(null, this.module);
		if (!this.module.validate()) {
			throw new Error('Invalid WebAssembly module.');
		}
	}
}
