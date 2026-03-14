import * as fs from 'node:fs';
import * as path from 'node:path';
import binaryen from 'binaryen';
import type {SymbolSchemaVar} from '../validator/index.ts';
import type {Temp} from '../optimizer/index.ts';
import {Field_new} from '../code-generator/index.ts';
import {Local} from './Local.ts';
import {BinVect} from './BinVect.ts';
import type {
	BinaryenModuleUpdates,
	TypeBuilder,
} from './-types.d.ts';



/**
 * The Builder generates assembly code.
 */
export class Builder {
	private static readonly IMPORTS: readonly string[] = [
		fs.readFileSync(path.join(import.meta.dirname, '../../src/code-generator/types.wat'), 'utf8'),
		fs.readFileSync(path.join(import.meta.dirname, '../../src/builder/exp.wat'), 'utf8'),
		fs.readFileSync(path.join(import.meta.dirname, '../../src/builder/fid.wat'), 'utf8'),
	];


	/** A lookup table for heap types created by a Binaryen TypeBuilder. */
	readonly #heapTypeRegistry = new Map<string, binaryen.Type>();

	/** A registry of reference (and reference-null) types. */
	readonly #refTypeRegistry = new Map<string, binaryen.Type>();

	#typeCount: bigint = 0n;

	/** A set containing data of WASM local variables. */
	readonly #locals = new Set<Local>();

	/** The Binaryen module to build upon building. */
	public readonly module: BinaryenModuleUpdates = binaryen.parseText(`
		(module
			${ Builder.IMPORTS.join('') }
		)
	`) as BinaryenModuleUpdates;

	// @ts-expect-error --- WASM 3.0 (incl. GC) not typed yet
	// eslint-disable-next-line
	public readonly typeBuilder: TypeBuilder = new binaryen.TypeBuilder();

	public constructor() {
		this.#setupTypes();
	}

	public nextTypeIndex(): bigint {
		return this.#typeCount++;
	}

	public getHeapType(key: string): binaryen.Type | undefined {
		return this.#heapTypeRegistry.get(key);
	}

	public getRefType(key: string): binaryen.Type | undefined {
		return this.#refTypeRegistry.get(key);
	}

	/**
	 * Create and add a new temporary local variable, for use in short-circuiting operations and placeholder values.
	 * @param value the binaryen value of the variable to add
	 * @param type  the type of the value; if not supplied, the Local will compute its type using `binaryen.getExpressionType`
	 * @return      the new local variable
	 */
	public newLocal(value: binaryen.ExpressionRef, typ?: binaryen.Type): Local {
		const local = new Local(this.module, this.#locals.size, value, typ);
		this.#locals.add(local);
		return local;
	}

	/**
	 * Set a local variable, given a variable id.
	 * If a variable with that id has already been added, do nothing.
	 * @param schema the compiler’s internal data for a declared variable or an optimizer temporary
	 * @param value  the binaryen value of the variable to set
	 * @param type   the type of the value; if not supplied, the Local will compute its type using `binaryen.getExpressionType`
	 * @return       Was the operation performed?
	 */
	public setLocal(schema: SymbolSchemaVar | Temp, value: binaryen.ExpressionRef, typ?: binaryen.Type): boolean {
		let did: boolean = false;
		if (!this.getLocal(schema)) {
			this.#locals.add(new Local(this.module, this.#locals.size, value, typ, schema));
			did = true;
		}
		return did;
	}

	/**
	 * Get the local with the given id in this Builder’s list, if it’s been added; else, return `null`.
	 * @param  id the schema of the local to get
	 * @return    the local or `undefined`
	 */
	public getLocal(schema: SymbolSchemaVar | Temp): Local | undefined {
		return [...this.#locals].find((local) => local.schema === schema);
	}

	/**
	 * Set and then return a local variable.
	 * @param schema the symbol schema of the variable to set
	 * @param value  the binaryen value of the variable to set
	 * @param type   the type of the value; if not supplied, the Local will compute its type using `binaryen.getExpressionType`
	 * @return       the local variable set (or retreived)
	 */
	public teeLocal(schema: SymbolSchemaVar | Temp, value: binaryen.ExpressionRef, type?: binaryen.Type): Local {
		this.setLocal(schema, value, type);
		return this.getLocal(schema)!;
	}

	/**
	 * Return a copy of a list of this Builder’s local variables.
	 * @return the local variables in an array
	 */
	public getAllLocals(): Local[] {
		return [...this.#locals];
	}

	/**
	 * Set up common types.
	 * We’ve defined these in a static `types.wat` file,
	 * but there’s currently no way to access them dynamically with Binaryen,
	 * so we repeat them here.
	 */
	#setupTypes(): void {
		// @ts-expect-error --- WASM 3.0 (incl. GC) not typed yet
		// eslint-disable-next-line
		const tb: TypeBuilder = new binaryen.TypeBuilder();

		let type_count: number = 0;

		/* (type $Value ...) */
		const i_value: number = type_count++;
		tb.grow(1);
		tb.setStructType(i_value, [
			Field_new(binaryen.i32, 'i8'),
			Field_new(binaryen.v128),
			Field_new(binaryen.eqref),
		]);

		/* (type $Property ...) */
		const i_property: number = type_count++;
		tb.grow(1);
		tb.setStructType(i_property, [
			Field_new(binaryen.i32),
			Field_new(tb.getTempRefType(tb.getTempHeapType(i_value), false)),
		]);

		/* (type $Tuple ...) */
		const i_tuple: number = type_count++;
		tb.grow(1);
		tb.setArrayType(
			i_tuple,
			tb.getTempRefType(tb.getTempHeapType(i_value), false),
			// @ts-expect-error --- WASM 3.0 (incl. GC) not typed yet
			// eslint-disable-next-line
			binaryen.notPacked,
			false,
		);

		/* (type $Record ...) */
		const i_record: number = type_count++;
		tb.grow(1);
		tb.setArrayType(
			i_record,
			tb.getTempRefType(tb.getTempHeapType(i_property), false),
			// @ts-expect-error --- WASM 3.0 (incl. GC) not typed yet
			// eslint-disable-next-line
			binaryen.notPacked,
			false,
		);

		/* (type $ListInternal ...) */
		const i_list_internal: number = type_count++;
		tb.grow(1);
		tb.setArrayType(
			i_list_internal,
			tb.getTempRefType(tb.getTempHeapType(i_value), true),
			// @ts-expect-error --- WASM 3.0 (incl. GC) not typed yet
			// eslint-disable-next-line
			binaryen.notPacked,
			true,
		);

		/* (type $DictInternal ...) */
		const i_dict_internal: number = type_count++;
		tb.grow(1);
		tb.setArrayType(
			i_dict_internal,
			tb.getTempRefType(tb.getTempHeapType(i_property), true),
			// @ts-expect-error --- WASM 3.0 (incl. GC) not typed yet
			// eslint-disable-next-line
			binaryen.notPacked,
			true,
		);

		/* (type $Object ...) */
		const i_object: number = type_count++;
		tb.grow(1);
		tb.setStructType(i_object, []);
		tb.setOpen(i_object);

		/* (type $List ...) */
		const i_list: number = type_count++;
		tb.grow(1);
		tb.setStructType(i_list, [
			Field_new(binaryen.v128, 'notPacked', true),
			Field_new(tb.getTempRefType(tb.getTempHeapType(i_list_internal), false), 'notPacked', true),
		]);
		tb.setSubType(i_list, tb.getTempHeapType(i_object));
		tb.setOpen(i_list);

		/* (type $Dict ...) */
		const i_dict: number = type_count++;
		tb.grow(1);
		tb.setStructType(i_dict, [
			Field_new(binaryen.v128, 'notPacked', true),
			Field_new(tb.getTempRefType(tb.getTempHeapType(i_dict_internal), false), 'notPacked', true),
		]);
		tb.setSubType(i_dict, tb.getTempHeapType(i_object));
		tb.setOpen(i_dict);

		const heap_types: readonly binaryen.Type[] = tb.buildAndDispose();

		this.#heapTypeRegistry.set('$Value',        heap_types[i_value]);
		this.#heapTypeRegistry.set('$Property',     heap_types[i_property]);
		this.#heapTypeRegistry.set('$Tuple',        heap_types[i_tuple]);
		this.#heapTypeRegistry.set('$Record',       heap_types[i_record]);
		this.#heapTypeRegistry.set('$ListInternal', heap_types[i_list_internal]);
		this.#heapTypeRegistry.set('$DictInternal', heap_types[i_dict_internal]);
		this.#heapTypeRegistry.set('$Object',       heap_types[i_object]);
		this.#heapTypeRegistry.set('$List',         heap_types[i_list]);
		this.#heapTypeRegistry.set('$Dict',         heap_types[i_dict]);

		// @ts-expect-error --- WASM 3.0 (incl. GC) not typed yet
		const {getTypeFromHeapType} = binaryen;

		/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call */
		this.#refTypeRegistry.set('(ref $Value)',        getTypeFromHeapType(heap_types[i_value],         false));
		this.#refTypeRegistry.set('(ref $Property)',     getTypeFromHeapType(heap_types[i_property],      false));
		this.#refTypeRegistry.set('(ref $Tuple)',        getTypeFromHeapType(heap_types[i_tuple],         false));
		this.#refTypeRegistry.set('(ref $Record)',       getTypeFromHeapType(heap_types[i_record],        false));
		this.#refTypeRegistry.set('(ref $ListInternal)', getTypeFromHeapType(heap_types[i_list_internal], false));
		this.#refTypeRegistry.set('(ref $DictInternal)', getTypeFromHeapType(heap_types[i_dict_internal], false));
		this.#refTypeRegistry.set('(ref $Object)',       getTypeFromHeapType(heap_types[i_object],        false));
		this.#refTypeRegistry.set('(ref $List)',         getTypeFromHeapType(heap_types[i_list],          false));
		this.#refTypeRegistry.set('(ref $Dict)',         getTypeFromHeapType(heap_types[i_dict],          false));

		this.#refTypeRegistry.set('(ref null $Value)',    getTypeFromHeapType(heap_types[i_value],    true)); // only used as the fields of `$ListInternal`
		this.#refTypeRegistry.set('(ref null $Property)', getTypeFromHeapType(heap_types[i_property], true)); // only used as the fields of `$DictInternal`
		/* eslint-enable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call */
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
		this.module.addFunction('isnull', binaryen.v128, binaryen.v128, [], this.module.block(null, [((mod: binaryen.Module) => (
			BinVect.asBool(mod, new BinVect(mod, mod.local.get(0, binaryen.v128)).isSpecial(null))
		))(this.module)], binaryen.v128));
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
