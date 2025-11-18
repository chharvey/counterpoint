import * as fs from 'node:fs';
import * as path from 'node:path';
import binaryen from 'binaryen';
import type {SymbolSchemaVar} from '../validator/index.ts';
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
	public addLocal(value: binaryen.ExpressionRef): Local {
		const local = new Local(this.module, this.locals.length, value);
		this.locals.push(local);
		return local;
	}

	/**
	 * Set a local variable, given a variable id.
	 * If a variable with that id has already been added, do nothing.
	 * @param schema the compiler’s internal data for a declared variable
	 * @param value  the binaryen value of the variable to set
	 * @return       Was the operation performed?
	 */
	public setLocal(schema: SymbolSchemaVar, value: binaryen.ExpressionRef): boolean {
		let did: boolean = false;
		if (!this.getLocal(schema)) {
			this.locals.push(new Local(this.module, this.locals.length, value, schema));
			did = true;
		}
		return did;
	}

	/**
	 * Remove a local variable.
	 * If the local variable doesn’t exist, do nothing.
	 * @param  schema the symbol schema of the variable to remove
	 * @return        Was the operation performed?
	 */
	public removeLocal(schema: SymbolSchemaVar): boolean {
		let did = false;
		const found = this.getLocal(schema);
		if (found) {
			this.locals.splice(this.locals.indexOf(found), 1);
			did = true;
		}
		return did;
	}

	/**
	 * Get the local with the given id in this Builder’s list, if it’s been added; else, return `null`.
	 * @param  schema the symbol schema of the local to get
	 * @return        the local or `null`
	 */
	public getLocal(schema: SymbolSchemaVar): Local | null {
		return this.locals.find((local) => local.schema === schema) ?? null;
	}

	/**
	 * Set a local variable to the given id and return it.
	 * If a variable with that id has already been added, this Builder’s state is not changed.
	 * @param schema the symbol schema of the variable to set
	 * @param value  the binaryen value of the variable to set
	 * @return      the local variable set (or retreived)
	 */
	public teeLocal(schema: SymbolSchemaVar, value: binaryen.ExpressionRef): Local {
		this.setLocal(schema, value);
		return this.getLocal(schema)!;
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
						BinVect.asBool(mod, mod.i32.and(local_vects[0].isAddr, mod.i64.eqz(local_vects[0].addrValue))),
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
		mod.addFunction('vtoi', binaryen.v128, binaryen.v128, [], mod.block(null, [
			mod.if(
				local_vects[0].isInt,
				local_vects[0].vect,
				mod.if(
					local_vects[0].isFloat,
					new BinVect(mod, mod.i64.trunc_s.f64(local_vects[0].floatValue)).vect,
					mod.unreachable(),
				),
			),
		], binaryen.v128));
		mod.addFunction('vtof', binaryen.v128, binaryen.v128, [], mod.block(null, [
			mod.if(
				local_vects[0].isFloat,
				local_vects[0].vect,
				mod.if(
					local_vects[0].isInt,
					new BinVect(mod, mod.f64.convert_s.i64(local_vects[0].intValue)).vect,
					mod.unreachable(),
				),
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
		const vlt_opts = [
			BinVect.asBool(mod, mod.i64.lt_s(                      local_vects[0].intValue,                         local_vects[1].intValue)),
			BinVect.asBool(mod, mod.f64.lt  (mod.f64.convert_s.i64(local_vects[0].intValue),                        local_vects[1].floatValue)),
			BinVect.asBool(mod, mod.f64.lt  (                      local_vects[0].floatValue, mod.f64.convert_s.i64(local_vects[1].intValue))),
			BinVect.asBool(mod, mod.f64.lt  (                      local_vects[0].floatValue,                       local_vects[1].floatValue)),
		] as const;
		mod.addFunction('vlt', binaryen.createType([binaryen.v128, binaryen.v128]), binaryen.v128, [], mod.block(null, [
			mod.if(
				local_vects[0].isInt,
				mod.if(local_vects[1].isInt, vlt_opts[0b00], mod.if(local_vects[1].isFloat, vlt_opts[0b01], mod.unreachable())),
				mod.if(local_vects[1].isInt, vlt_opts[0b10], mod.if(local_vects[1].isFloat, vlt_opts[0b11], mod.unreachable())),
			),
		], binaryen.v128));
		const vgt_opts = [
			BinVect.asBool(mod, mod.i64.gt_s(                      local_vects[0].intValue,                         local_vects[1].intValue)),
			BinVect.asBool(mod, mod.f64.gt  (mod.f64.convert_s.i64(local_vects[0].intValue),                        local_vects[1].floatValue)),
			BinVect.asBool(mod, mod.f64.gt  (                      local_vects[0].floatValue, mod.f64.convert_s.i64(local_vects[1].intValue))),
			BinVect.asBool(mod, mod.f64.gt  (                      local_vects[0].floatValue,                       local_vects[1].floatValue)),
		] as const;
		mod.addFunction('vgt', binaryen.createType([binaryen.v128, binaryen.v128]), binaryen.v128, [], mod.block(null, [
			mod.if(
				local_vects[0].isInt,
				mod.if(local_vects[1].isInt, vgt_opts[0b00], mod.if(local_vects[1].isFloat, vgt_opts[0b01], mod.unreachable())),
				mod.if(local_vects[1].isInt, vgt_opts[0b10], mod.if(local_vects[1].isFloat, vgt_opts[0b11], mod.unreachable())),
			),
		], binaryen.v128));
		const vle_opts = [
			BinVect.asBool(mod, mod.i64.le_s(                      local_vects[0].intValue,                         local_vects[1].intValue)),
			BinVect.asBool(mod, mod.f64.le  (mod.f64.convert_s.i64(local_vects[0].intValue),                        local_vects[1].floatValue)),
			BinVect.asBool(mod, mod.f64.le  (                      local_vects[0].floatValue, mod.f64.convert_s.i64(local_vects[1].intValue))),
			BinVect.asBool(mod, mod.f64.le  (                      local_vects[0].floatValue,                       local_vects[1].floatValue)),
		] as const;
		mod.addFunction('vle', binaryen.createType([binaryen.v128, binaryen.v128]), binaryen.v128, [], mod.block(null, [
			mod.if(
				local_vects[0].isInt,
				mod.if(local_vects[1].isInt, vle_opts[0b00], mod.if(local_vects[1].isFloat, vle_opts[0b01], mod.unreachable())),
				mod.if(local_vects[1].isInt, vle_opts[0b10], mod.if(local_vects[1].isFloat, vle_opts[0b11], mod.unreachable())),
			),
		], binaryen.v128));
		const vge_opts = [
			BinVect.asBool(mod, mod.i64.ge_s(                      local_vects[0].intValue,                         local_vects[1].intValue)),
			BinVect.asBool(mod, mod.f64.ge  (mod.f64.convert_s.i64(local_vects[0].intValue),                        local_vects[1].floatValue)),
			BinVect.asBool(mod, mod.f64.ge  (                      local_vects[0].floatValue, mod.f64.convert_s.i64(local_vects[1].intValue))),
			BinVect.asBool(mod, mod.f64.ge  (                      local_vects[0].floatValue,                       local_vects[1].floatValue)),
		] as const;
		mod.addFunction('vge', binaryen.createType([binaryen.v128, binaryen.v128]), binaryen.v128, [], mod.block(null, [
			mod.if(
				local_vects[0].isInt,
				mod.if(local_vects[1].isInt, vge_opts[0b00], mod.if(local_vects[1].isFloat, vge_opts[0b01], mod.unreachable())),
				mod.if(local_vects[1].isInt, vge_opts[0b10], mod.if(local_vects[1].isFloat, vge_opts[0b11], mod.unreachable())),
			),
		], binaryen.v128));
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
			BinVect.asBool(mod, mod.f64.eq(mod.f64.convert_s.i64(local_vects[0].intValue),                        local_vects[1].floatValue)),
			BinVect.asBool(mod, mod.f64.eq(                      local_vects[0].floatValue, mod.f64.convert_s.i64(local_vects[1].intValue))),
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
	 * Prepare this builder’s module, with optional additional actions/modifications.
	 * @param main a callback to run after setup but before validation
	 */
	public setupModule(main?: (mod: binaryen.Module) => void): void {
		this.module.setFeatures(( // NOTE: features are bit tags; to add them we must use bit-wise disjunction
			/* eslint-disable @stylistic/operator-linebreak */
			binaryen.Features.SIMD128 |
			binaryen.Features.ReferenceTypes |
			binaryen.Features.Multivalue
			/* eslint-enable @stylistic/operator-linebreak */
		));
		this.#setupFunctions();
		main?.call(null, this.module);
		if (!this.module.validate()) {
			throw new Error('Invalid WebAssembly module.');
		}
	}
}
