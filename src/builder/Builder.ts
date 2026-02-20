import * as fs from 'node:fs';
import * as path from 'node:path';
import binaryen from 'binaryen';
import type {
	AST,
	SymbolSchemaVar,
} from '../validator/index.ts';
import {bigint_to_i64} from './utils-public.ts';
import {Local} from './Local.ts';
import {BinVect} from './BinVect.ts';
import type {
	BinaryenModuleUpdates,
	TypeBuilder,
} from './-types.d.ts';



/**
 * A type modeling the Binaryen `module.block`.
 */
type Block = {
	readonly index: number,
	readonly node:  AST.ASTNodeCP,
};



/**
 * The Builder generates assembly code.
 */
export class Builder {
	private static readonly IMPORTS: readonly string[] = [
		fs.readFileSync(path.join(import.meta.dirname, '../../src/builder/exp.wat'), 'utf8'),
		fs.readFileSync(path.join(import.meta.dirname, '../../src/builder/fid.wat'), 'utf8'),
	];


	#typeCount: bigint = 0n;

	/** A set containing local variables. */
	private readonly locals = new Set<Local>();

	/** A set containing blocks. */
	private readonly blocks = new Set<Block>();

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
	 * Add a new local variable.
	 * @param value the binaryen value of the variable to add
	 * @return      [`this`, the new local variable]
	 */
	public addLocal(value: binaryen.ExpressionRef): Local {
		const local = new Local(this.module, this.locals.size, value);
		this.locals.add(local);
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
			this.locals.add(new Local(this.module, this.locals.size, value, schema));
			did = true;
		}
		return did;
	}

	/**
	 * Get the local with the given id in this Builder’s list, if it’s been added; else, return `undefined`.
	 * @param  schema the symbol schema of the local to get
	 * @return        the local or `undefined`
	 */
	public getLocal(schema: SymbolSchemaVar): Local | undefined {
		return [...this.locals].find((local) => local.schema === schema);
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
	public getAllLocals(): Local[] {
		return [...this.locals];
	}

	/**
	 * Set a new block, given an ASTNode.
	 * @param node node that builds the block
	 * @return     Was the operation performed?
	 */
	public setBlock(node: AST.ASTNodeCP): boolean {
		let did: boolean = false;
		if (!this.getBlock(node)) {
			this.blocks.add({node, index: this.blocks.size});
			did = true;
		}
		return did;
	}

	/**
	 * Get the block with the given node in this Builder’s list, if it’s been added; else, return `undefined`.
	 * @param  node the node of the block to get
	 * @return      the block or `undefined`
	 */
	public getBlock(node: AST.ASTNodeCP): Block | undefined {
		return [...this.blocks].find((block) => block.node === node);
	}

	/**
	 * Set a block to the given id and return it.
	 * If a block with that id has already been added, this Builder’s state is not changed.
	 * @param node the node of the block to set
	 * @return     the block set (or retreived)
	 */
	public teeBlock(node: AST.ASTNodeCP): Block {
		this.setBlock(node);
		return this.getBlock(node)!;
	}

	#binOpArithmetic(
		name:    string,
		method:  (left: binaryen.ExpressionRef, right: binaryen.ExpressionRef) => binaryen.ExpressionRef,
		typekey: 'intValue' | 'floatValue',
	): binaryen.FunctionRef {
		const mod: binaryen.Module = this.module;
		const local_vects = [
			new BinVect(mod, mod.local.get(0, binaryen.v128)),
			new BinVect(mod, mod.local.get(1, binaryen.v128)),
		] as const;
		return mod.addFunction(name, binaryen.createType([binaryen.v128, binaryen.v128]), binaryen.v128, [], mod.block(null, [
			new BinVect(mod, method.call(null, local_vects[0][typekey], local_vects[1][typekey])).vect,
		], binaryen.v128));
	}

	#binOpComparative(
		name:        string,
		method_ints: (left: binaryen.ExpressionRef, right: binaryen.ExpressionRef) => binaryen.ExpressionRef,
		method_nats: (left: binaryen.ExpressionRef, right: binaryen.ExpressionRef) => binaryen.ExpressionRef,
		method_flts: (left: binaryen.ExpressionRef, right: binaryen.ExpressionRef) => binaryen.ExpressionRef,
	): binaryen.FunctionRef {
		const mod: binaryen.Module = this.module;
		const local_vects = [
			new BinVect(mod, mod.local.get(0, binaryen.v128)),
			new BinVect(mod, mod.local.get(1, binaryen.v128)),
		] as const;
		const int_int: binaryen.ExpressionRef = BinVect.asBool(mod, method_ints.call(null, local_vects[0].intValue,   local_vects[1].intValue));
		const int_nat: binaryen.ExpressionRef = BinVect.asBool(mod, method_nats.call(null, local_vects[0].natValue,   local_vects[1].natValue));
		const int_flt: binaryen.ExpressionRef = BinVect.asBool(mod, method_flts.call(null, local_vects[0].i_to_f(),   local_vects[1].floatValue));
		const nat_int: binaryen.ExpressionRef = BinVect.asBool(mod, method_nats.call(null, local_vects[0].natValue,   local_vects[1].natValue));
		const nat_nat: binaryen.ExpressionRef = BinVect.asBool(mod, method_nats.call(null, local_vects[0].natValue,   local_vects[1].natValue));
		const nat_flt: binaryen.ExpressionRef = BinVect.asBool(mod, method_flts.call(null, local_vects[0].n_to_f(),   local_vects[1].floatValue));
		const flt_int: binaryen.ExpressionRef = BinVect.asBool(mod, method_flts.call(null, local_vects[0].floatValue, local_vects[1].i_to_f()));
		const flt_nat: binaryen.ExpressionRef = BinVect.asBool(mod, method_flts.call(null, local_vects[0].floatValue, local_vects[1].n_to_f()));
		const flt_flt: binaryen.ExpressionRef = BinVect.asBool(mod, method_flts.call(null, local_vects[0].floatValue, local_vects[1].floatValue));
		return mod.addFunction(name, binaryen.createType([binaryen.v128, binaryen.v128]), binaryen.v128, [], mod.block(null, [
			mod.if(
				local_vects[0].isInt,
				mod.if(
					local_vects[1].isInt,
					int_int,
					mod.if(
						local_vects[1].isNat,
						int_nat,
						mod.if(
							local_vects[1].isFloat,
							int_flt,
							mod.unreachable(),
						),
					),
				),
				mod.if(
					local_vects[0].isNat,
					mod.if(
						local_vects[1].isInt,
						nat_int,
						mod.if(
							local_vects[1].isNat,
							nat_nat,
							mod.if(
								local_vects[1].isFloat,
								nat_flt,
								mod.unreachable(),
							),
						),
					),
					mod.if(
						local_vects[0].isFloat,
						mod.if(
							local_vects[1].isInt,
							flt_int,
							mod.if(
								local_vects[1].isNat,
								flt_nat,
								mod.if(
									local_vects[1].isFloat,
									flt_flt,
									mod.unreachable(),
								),
							),
						),
						mod.unreachable(),
					),
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
						local_vects[0].isNat,
						BinVect.asBool(mod, mod.i64.eqz(local_vects[0].natValue)),
						mod.if(
							local_vects[0].isFloat,
							BinVect.asBool(mod, mod.f64.eq(local_vects[0].floatValue, mod.f64.const(0.0))), // also takes care of -0.0
							BinVect.asBool(mod, mod.i32.and(local_vects[0].isAddr, mod.i64.eqz(local_vects[0].addrValue))),
						),
					),
				),
			),
		], binaryen.v128));
		mod.addFunction('vneg', binaryen.v128, binaryen.v128, [], mod.block(null, [
			mod.if(
				local_vects[0].isInt,
				// `-n` in two’s complement is `(n xor -1) + 1`
				new BinVect(mod, mod.i64.add(mod.i64.xor(local_vects[0].intValue, mod.i64.const(-1, 0)), mod.i64.const(1, 0))).vect,
				mod.if(
					local_vects[0].isFloat,
					new BinVect(mod, mod.f64.neg(local_vects[0].floatValue)).vect,
					mod.unreachable(),
				),
			),
		], binaryen.v128));
		mod.addFunction('vtoi', binaryen.v128, binaryen.v128, [], mod.block(null, [
			mod.if(
				local_vects[0].isInt,
				local_vects[0].vect,
				mod.if(
					local_vects[0].isNat,
					new BinVect(mod, local_vects[0].natValue, {unsigned: false}).vect,
					mod.if(
						local_vects[0].isFloat,
						new BinVect(mod, local_vects[0].f_to_i()).vect,
						mod.unreachable(),
					),
				),
			),
		], binaryen.v128));
		mod.addFunction('vton', binaryen.v128, binaryen.v128, [], mod.block(null, [
			mod.if(
				local_vects[0].isInt,
				new BinVect(mod, local_vects[0].intValue, {unsigned: true}).vect,
				mod.if(
					local_vects[0].isNat,
					local_vects[0].vect,
					mod.if(
						local_vects[0].isFloat,
						new BinVect(mod, local_vects[0].f_to_n()).vect,
						mod.unreachable(),
					),
				),
			),
		], binaryen.v128));
		mod.addFunction('vtof', binaryen.v128, binaryen.v128, [], mod.block(null, [
			mod.if(
				local_vects[0].isInt,
				new BinVect(mod, local_vects[0].i_to_f()).vect,
				mod.if(
					local_vects[0].isNat,
					new BinVect(mod, local_vects[0].n_to_f()).vect,
					mod.if(
						local_vects[0].isFloat,
						local_vects[0].vect,
						mod.unreachable(),
					),
				),
			),
		], binaryen.v128));

		this.#binOpArithmetic('viexp',   (i0, i1) => mod.call('iexp', [i0, i1], binaryen.i64), 'intValue');
		this.#binOpArithmetic('vimul',   mod.i64.mul  .bind(null), 'intValue');
		this.#binOpArithmetic('vfmul',   mod.f64.mul  .bind(null), 'floatValue');
		this.#binOpArithmetic('vidiv_s', mod.i64.div_s.bind(null), 'intValue');
		this.#binOpArithmetic('vidiv_u', mod.i64.div_u.bind(null), 'intValue');
		this.#binOpArithmetic('vfdiv',   mod.f64.div  .bind(null), 'floatValue');
		this.#binOpArithmetic('viadd',   mod.i64.add  .bind(null), 'intValue');
		this.#binOpArithmetic('vfadd',   mod.f64.add  .bind(null), 'floatValue');
		this.#binOpArithmetic('visub_s', mod.i64.sub  .bind(null), 'intValue');
		this.#binOpArithmetic('vfsub',   mod.f64.sub  .bind(null), 'floatValue');

		this.#binOpArithmetic('visub_u', (i0, i1) => mod.if(
			mod.i64.lt_u(i0, i1),
			bigint_to_i64(mod, 0n, true),
			mod.i64.sub(i0, i1),
		), 'intValue');

		this.#binOpComparative('vlt', mod.i64.lt_s.bind(null), mod.i64.lt_u.bind(null), mod.f64.lt.bind(null));
		this.#binOpComparative('vgt', mod.i64.gt_s.bind(null), mod.i64.gt_u.bind(null), mod.f64.gt.bind(null));
		this.#binOpComparative('vle', mod.i64.le_s.bind(null), mod.i64.le_u.bind(null), mod.f64.le.bind(null));
		this.#binOpComparative('vge', mod.i64.ge_s.bind(null), mod.i64.ge_u.bind(null), mod.f64.ge.bind(null));

		mod.addFunction('vid', binaryen.createType([binaryen.v128, binaryen.v128]), binaryen.v128, [], mod.block(null, [
			mod.if(
				mod.i32.and(local_vects[0].isSpecial(), local_vects[1].isSpecial()),
				BinVect.asBool(mod, mod.i32.eq(local_vects[0].specialValue, local_vects[1].specialValue)),
				mod.if(
					mod.i32.and(local_vects[0].isInt, local_vects[1].isInt),
					BinVect.asBool(mod, mod.i64.eq(local_vects[0].intValue, local_vects[1].intValue)), // `i64.eq` for ints gives the same result as `ID` operator
					mod.if(
						mod.i32.and(local_vects[0].isNat, local_vects[1].isNat),
						BinVect.asBool(mod, mod.i64.eq(local_vects[0].natValue, local_vects[1].natValue)),
						mod.if(
							mod.i32.and(local_vects[0].isFloat, local_vects[1].isFloat),
							BinVect.asBool(mod, mod.call('fid', [local_vects[0].floatValue, local_vects[1].floatValue], binaryen.i32)),
							new BinVect(mod, false).vect,
						),
					),
				),
			),
		], binaryen.v128));

		this.#binOpComparative('veq', mod.i64.eq.bind(null), mod.i64.eq.bind(null), mod.f64.eq.bind(null));
	}

	/**
	 * Prepare this builder’s module, with optional additional actions/modifications.
	 * @param main a callback to run after setup but before validation
	 */
	public setupModule(main?: (mod: binaryen.Module) => void): void {
		this.module.setFeatures(( // NOTE: features are bit tags; to add them we must use bit-wise disjunction
			/* eslint-disable @stylistic/operator-linebreak */
			binaryen.Features.NontrappingFPToInt |
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
