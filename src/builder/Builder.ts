import * as fs from 'node:fs';
import * as path from 'node:path';
import binaryen from 'binaryen';
import {Local} from './Local.ts';
import {BinVect} from './BinVect.ts';



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

	/** A setlist containing ids of local variables. */
	private readonly locals: Local[] = [];

	/** The Binaryen module to build upon building. */
	public readonly module: binaryen.Module = binaryen.parseText(`
		(module
			${ Builder.IMPORTS.join('') }
		)
	`);


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
		name:                                   string,
		[result_both_ints, result_both_floats]: readonly [binaryen.ExpressionRef, binaryen.ExpressionRef],
	): binaryen.FunctionRef {
		const mod: binaryen.Module = this.module;
		const local_vects = [
			new BinVect(mod, mod.local.get(0, binaryen.v128)),
			new BinVect(mod, mod.local.get(1, binaryen.v128)),
		] as const;
		return mod.addFunction(name, binaryen.createType([binaryen.v128, binaryen.v128]), binaryen.v128, [], mod.block(null, [
			mod.if(
				mod.i32.and(local_vects[0].isInt, local_vects[1].isInt),
				result_both_ints,
				mod.if(
					mod.i32.and(local_vects[0].isFloat, local_vects[1].isFloat),
					result_both_floats,
					mod.unreachable(),
				),
			),
		], binaryen.v128));
	}

	#setupFunctions(): void {
		const mod: binaryen.Module = this.module;
		const local_vects = [
			new BinVect(mod, mod.local.get(0, binaryen.v128)),
			new BinVect(mod, mod.local.get(1, binaryen.v128)),
		] as const;
		mod.addFunction('vnot', binaryen.v128, binaryen.v128, [], mod.block(null, [
			BinVect.asBool(mod, mod.i32.or(local_vects[0].isSpecial(null), local_vects[0].isSpecial(false))),
		], binaryen.v128));
		mod.addFunction('vemp', binaryen.v128, binaryen.v128, [], mod.block(null, [
			mod.if(
				local_vects[0].isSpecial(),
				mod.call('vnot', [local_vects[0].vect], binaryen.v128),
				mod.if(
					local_vects[0].isInt,
					BinVect.asBool(mod, mod.i64.eqz(local_vects[0].intValue)),
					mod.if(
						local_vects[0].isFloat,
						BinVect.asBool(mod, mod.f64.eq(local_vects[0].floatValue, mod.f64.const(0.0))), // also takes care of -0.0
						BinVect.asBool(mod, local_vects[0].isTuple),
					),
				),
			),
		], binaryen.v128));
		mod.addFunction('vneg', binaryen.v128, binaryen.v128, [], mod.block(null, [
			mod.if(
				local_vects[0].isInt,
				// `-n` in two’s complement is `(n xor -1) + 1`
				new BinVect(mod, mod.i64.add(mod.i64.xor(local_vects[0].intValue, mod.i64.const(-1, 0)), mod.i64.const(1, 0))).vect,
				new BinVect(mod, mod.f64.neg(local_vects[0].floatValue)).vect,
			),
		], binaryen.v128));
		this.#binOpFunction('vexp', [
			new BinVect(mod, mod.call('exp', [local_vects[0].intValue, local_vects[1].intValue], binaryen.i64)).vect,
			mod.unreachable(),
		]);
		this.#binOpFunction('vmul', [
			new BinVect(mod, mod.i64.mul(local_vects[0].intValue,   local_vects[1].intValue)).vect,
			new BinVect(mod, mod.f64.mul(local_vects[0].floatValue, local_vects[1].floatValue)).vect,
		]);
		this.#binOpFunction('vdiv', [
			new BinVect(mod, mod.i64.div_s(local_vects[0].intValue,   local_vects[1].intValue)).vect,
			new BinVect(mod, mod.f64.div  (local_vects[0].floatValue, local_vects[1].floatValue)).vect,
		]);
		this.#binOpFunction('vadd', [
			new BinVect(mod, mod.i64.add(local_vects[0].intValue,   local_vects[1].intValue)).vect,
			new BinVect(mod, mod.f64.add(local_vects[0].floatValue, local_vects[1].floatValue)).vect,
		]);
		this.#binOpFunction('vlt', [
			BinVect.asBool(mod, mod.i64.lt_s(local_vects[0].intValue,   local_vects[1].intValue)),
			BinVect.asBool(mod, mod.f64.lt  (local_vects[0].floatValue, local_vects[1].floatValue)),
		]);
		this.#binOpFunction('vgt', [
			BinVect.asBool(mod, mod.i64.gt_s(local_vects[0].intValue,   local_vects[1].intValue)),
			BinVect.asBool(mod, mod.f64.gt  (local_vects[0].floatValue, local_vects[1].floatValue)),
		]);
		this.#binOpFunction('vle', [
			BinVect.asBool(mod, mod.i64.le_s(local_vects[0].intValue,   local_vects[1].intValue)),
			BinVect.asBool(mod, mod.f64.le  (local_vects[0].floatValue, local_vects[1].floatValue)),
		]);
		this.#binOpFunction('vge', [
			BinVect.asBool(mod, mod.i64.ge_s(local_vects[0].intValue,   local_vects[1].intValue)),
			BinVect.asBool(mod, mod.f64.ge  (local_vects[0].floatValue, local_vects[1].floatValue)),
		]);
		mod.addFunction('vid', binaryen.createType([binaryen.v128, binaryen.v128]), binaryen.v128, [], mod.block(null, [
			mod.if(
				mod.i32.and(local_vects[0].isSpecial(), local_vects[1].isSpecial()),
				BinVect.asBool(mod, mod.i32.eq(local_vects[0].specialValue, local_vects[1].specialValue)),
				mod.if(
					mod.i32.and(local_vects[0].isInt, local_vects[1].isInt),
					BinVect.asBool(mod, mod.i64.eq(local_vects[0].intValue, local_vects[1].intValue)), // `i64.eq` for ints gives the same result as `ID` operator
					mod.if(
						mod.i32.and(local_vects[0].isFloat, local_vects[1].isFloat),
						BinVect.asBool(mod, mod.call('fid', [local_vects[0].floatValue, local_vects[1].floatValue], binaryen.i32)),
						new BinVect(mod, false).vect,
					),
				),
			),
		], binaryen.v128));
		const veq_opts = [
			BinVect.asBool(mod, mod.i64.eq(                      local_vects[0].intValue,                         local_vects[1].intValue)),
			BinVect.asBool(mod, mod.f64.eq(mod.f64.convert_u.i64(local_vects[0].intValue),                        local_vects[1].floatValue)),
			BinVect.asBool(mod, mod.f64.eq(                      local_vects[0].floatValue, mod.f64.convert_u.i64(local_vects[1].intValue))),
			BinVect.asBool(mod, mod.f64.eq(                      local_vects[0].floatValue,                       local_vects[1].floatValue)),
		] as const;
		mod.addFunction('veq', binaryen.createType([binaryen.v128, binaryen.v128]), binaryen.v128, [], mod.block(null, [
			mod.if(
				mod.i32.or(local_vects[0].isSpecial(), local_vects[1].isSpecial()),
				mod.call('vid', local_vects.map((v) => v.vect), binaryen.v128),
				mod.if(
					local_vects[0].isInt,
					mod.if(local_vects[1].isInt, veq_opts[0b00], mod.if(local_vects[1].isFloat, veq_opts[0b01], new BinVect(mod, false).vect)),
					mod.if(local_vects[1].isInt, veq_opts[0b10], mod.if(local_vects[1].isFloat, veq_opts[0b11], new BinVect(mod, false).vect)),
				),
			),
		], binaryen.v128));
	}

	/**
	 * Prepare this builder’s module and return an action to validate it.
	 * @return a callback that validates the module, to be performed after any further modifications to the module are made
	 */
	public setupModule(): () => void {
		this.module.setFeatures(( // NOTE: features are bit tags; to add them we must use bit-wise disjunction
			/* eslint-disable @stylistic/operator-linebreak */
			binaryen.Features.ReferenceTypes |
			binaryen.Features.SIMD128 |
			binaryen.Features.Multivalue
			/* eslint-enable @stylistic/operator-linebreak */
		));
		this.#setupFunctions();
		return () => {
			if (!this.module.validate()) {
				throw new Error('Invalid WebAssembly module.');
			}
		};
	}
}
