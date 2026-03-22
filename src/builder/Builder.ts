import * as assert from 'node:assert';
import * as fs from 'node:fs';
import * as path from 'node:path';
import binaryen from 'binaryen';
import type {SymbolSchemaVar} from '../validator/index.ts';
import type {Temp} from '../optimizer/index.ts';
import {BinValue} from '../code-generator/index.ts';
import {Local} from './Local.ts';
import {BinVect} from './BinVect.ts';
import type {
	BinaryenModuleUpdates,
	Field,
	TypeBuilder,
} from './-types.d.ts';



type HeaptypeKey = (
	| '$Value'
	| '$Property'
	| '$Tuple'
	| '$Record'
	| '$ListInternal'
	| '$DictInternal'
	| '$Object'
	| '$List'
	| '$Dict'
);
type ReftypeKey = `(ref ${ 'null ' | '' }${ HeaptypeKey })`;



/**
 * Insert entries into an internal array for a record/Dict.
 *
 * Find a bucket in which to place the entry.
 * By default this will have index `id mod capacity`,
 * but in the case of collisions we will use the *linear probing* technique.
 *
 * This function mutates the `array` argument.
 * For records, the array will have been completely filled by the time this function returns.
 * For Dicts, the array may still have empty slots (native `undefined`);
 * these are expected to be filled with `(ref.null $Property)` values later, but are not done so here.
 *
 * @param entry the entry to insert; must be of type `(ref $Property)` in the case of records, `(ref null $Property)` in the case of Dicts
 * @param index the index of the internal array at which to attempt to insert the entry; should be the result of an already-hashed key
 * @param array an empty array in which to insert the entry
 * @see https://en.wikipedia.org/wiki/Linear_probing
 */
function insert_entry(array: Array<binaryen.ExpressionRef | undefined>, index: number, entry: binaryen.ExpressionRef): void {
	if (index < 0 || array.length <= index) {
		throw new RangeError('Given index must not be out of array bounds.');
	}
	if (array[index] === undefined) {
		array[index] = entry;
		return;
	}
	return insert_entry(array, (index + 1) % array.length, entry);
}



/**
 * The Builder generates assembly code.
 */
export class Builder {
	private static readonly IMPORTS: readonly string[] = [
		fs.readFileSync(path.join(import.meta.dirname, '../../src/code-generator/types.wat'), 'utf8'),
		fs.readFileSync(path.join(import.meta.dirname, '../../src/builder/exp.wat'), 'utf8'),
		fs.readFileSync(path.join(import.meta.dirname, '../../src/builder/fid.wat'), 'utf8'),
		fs.readFileSync(path.join(import.meta.dirname, '../../src/code-generator/mod.wat'), 'utf8'),
		fs.readFileSync(path.join(import.meta.dirname, '../../src/code-generator/capacity-needed.wat'), 'utf8'),
		fs.readFileSync(path.join(import.meta.dirname, '../../src/code-generator/Property.wat'), 'utf8'),
		fs.readFileSync(path.join(import.meta.dirname, '../../src/code-generator/Record.wat'), 'utf8'),
		fs.readFileSync(path.join(import.meta.dirname, '../../src/code-generator/List.wat'), 'utf8'),
		fs.readFileSync(path.join(import.meta.dirname, '../../src/code-generator/Dict.wat'), 'utf8'),
	];

	/**
	 * Create a new struct field for a `TypeBuilder`.
	 * @param typ        the field type
	 * @param packedType one of `'notPacked' | 'i8' | 'i16'` @default `'notPacked'`
	 * @param mutable    Can the field be reassigned?        @default `false`
	 */
	private static newField(typ: binaryen.Type, packedType: 'notPacked' | 'i8' | 'i16' = 'notPacked', mutable: boolean = false): Field {
		return {
			type:       typ,
			// @ts-expect-error --- WASM 3.0 (incl. GC) not typed yet
			// eslint-disable-next-line
			packedType: binaryen[packedType],
			mutable,
		};
	}


	/** A lookup table for heap types created by a Binaryen TypeBuilder. */
	readonly #heaptypeRegistry = new Map<HeaptypeKey, binaryen.Type>();

	/** A registry of reference (and reference-null) types. */
	readonly #reftypeRegistry = new Map<ReftypeKey, binaryen.Type>();

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

	public getHeaptype(key: HeaptypeKey): binaryen.Type {
		assert.ok(this.#heaptypeRegistry.has(key), `Expected type registry to have type \`${ key }\`.`);
		return this.#heaptypeRegistry.get(key)!;
	}

	public getReftype(key: ReftypeKey): binaryen.Type {
		assert.ok(this.#reftypeRegistry.has(key), `Expected type registry to have type \`${ key }\`.`);
		return this.#reftypeRegistry.get(key)!;
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
	 * @return       the local variable set (or retrieved)
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
	 * Return a new `$Tuple` from items.
	 * @param items items in the array; must be of type `(ref $Value)`
	 * @return      `(array.new_fixed $Tuple <...items>)`
	 */
	public codegenTuple(items: readonly binaryen.ExpressionRef[] = []): binaryen.ExpressionRef {
		return this.module.array.new_fixed(this.getHeaptype('$Tuple'), items);
	}

	/**
	 * Return a new `$Record` from properties.
	 * This method automatically hashes the property keys and inserts them at the correct indices.
	 * @param props key–value pairs whose keys are key ids (`bigint`s) and whose values (of type `(ref $Property)`) are items in the array
	 * @return      `(array.new_fixed $Record <...props>)`
	 */
	public codegenRecord(props: ReadonlyMap<bigint, binaryen.ExpressionRef> = new Map()): binaryen.ExpressionRef {
		const entries = new Array<binaryen.ExpressionRef | undefined>(props.size);
		props.forEach((code, id) => insert_entry(entries, Number(id) % entries.length, code));
		return this.module.array.new_fixed(this.getHeaptype('$Record'), entries as binaryen.ExpressionRef[]);
	}

	/**
	 * Return a new `$List` from items.
	 * The capacity of `$ListInternal` is always the least power of 2 greater than or equal to
	 * the number of given items (the List’s count), or 8, whichever is greater.
	 * This method automatically populates blank slots with the WASM expression `(ref.null $Value)`.
	 * @param items items in the array; must be of type `(ref null $Value)`
	 * @return      `(struct.new $List <count> (array.new_fixed $ListInternal <...items>))`
	 */
	public codegenList(items: readonly binaryen.ExpressionRef[] = []): binaryen.ExpressionRef {
		let capacity: number = 8;
		while (capacity < items.length * 8 / 7) {
			capacity *= 2;
		}
		const entries: binaryen.ExpressionRef[] = Array.from(
			new Array(capacity),
			(_, i) => items[i] ?? this.module.ref.null(this.getReftype('(ref null $Value)')),
		);
		return this.module.struct.new([
			this.module.i32.const(items.length),
			this.module.array.new_fixed(this.getHeaptype('$ListInternal'), entries),
		], this.getHeaptype('$List'));
	}

	/**
	 * Return a new `$Dict` from properties.
	 * This method automatically hashes the property keys and inserts them at the correct indices,
	 * as well as populates blank slots with the WASM expression `(ref.null $Property)`.
	 * @param props key–value pairs whose keys are key ids (`bigint`s) and whose values (of type `(ref null $Property)`) are items in the array
	 * @return      `(struct.new $Dict <count> (array.new_fixed $DictInternal <...items>))`
	 */
	public codegenDict(props: ReadonlyMap<bigint, binaryen.ExpressionRef> = new Map()): binaryen.ExpressionRef {
		let capacity: number = 8;
		while (capacity < props.size * 8 / 7) {
			capacity *= 2;
		}
		const entries = new Array<binaryen.ExpressionRef | undefined>(capacity).fill(undefined);
		props.forEach((code, id) => insert_entry(entries, Number(id) % entries.length, code));
		return this.module.struct.new([
			this.module.i32.const(props.size),
			this.module.array.new_fixed(
				this.getHeaptype('$DictInternal'),
				entries.map((entry) => entry ?? this.module.ref.null(this.getReftype('(ref null $Property)'))),
			),
		], this.getHeaptype('$Dict'));
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
			/* $tag */       Builder.newField(binaryen.i32, 'i8'),
			/* $primitive */ Builder.newField(binaryen.v128),
			/* $composite */ Builder.newField(binaryen.eqref),
		]);

		/* (type $Property ...) */
		const i_property: number = type_count++;
		tb.grow(1);
		tb.setStructType(i_property, [
			/* $key */   Builder.newField(binaryen.i32),
			/* $value */ Builder.newField(tb.getTempRefType(tb.getTempHeapType(i_value), false)),
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
			/* $size */     Builder.newField(binaryen.i32, 'notPacked', true),
			/* $internal */ Builder.newField(tb.getTempRefType(tb.getTempHeapType(i_list_internal), false), 'notPacked', true),
		]);
		tb.setSubType(i_list, tb.getTempHeapType(i_object));
		tb.setOpen(i_list);

		/* (type $Dict ...) */
		const i_dict: number = type_count++;
		tb.grow(1);
		tb.setStructType(i_dict, [
			/* $size */     Builder.newField(binaryen.i32, 'notPacked', true),
			/* $internal */ Builder.newField(tb.getTempRefType(tb.getTempHeapType(i_dict_internal), false), 'notPacked', true),
		]);
		tb.setSubType(i_dict, tb.getTempHeapType(i_object));
		tb.setOpen(i_dict);

		const heaptypes: readonly binaryen.Type[] = tb.buildAndDispose();

		this.#heaptypeRegistry.set('$Value',        heaptypes[i_value]);
		this.#heaptypeRegistry.set('$Property',     heaptypes[i_property]);
		this.#heaptypeRegistry.set('$Tuple',        heaptypes[i_tuple]);
		this.#heaptypeRegistry.set('$Record',       heaptypes[i_record]);
		this.#heaptypeRegistry.set('$ListInternal', heaptypes[i_list_internal]);
		this.#heaptypeRegistry.set('$DictInternal', heaptypes[i_dict_internal]);
		this.#heaptypeRegistry.set('$Object',       heaptypes[i_object]);
		this.#heaptypeRegistry.set('$List',         heaptypes[i_list]);
		this.#heaptypeRegistry.set('$Dict',         heaptypes[i_dict]);

		// @ts-expect-error --- WASM 3.0 (incl. GC) not typed yet
		const {getTypeFromHeapType} = binaryen;

		/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call */
		this.#reftypeRegistry.set('(ref $Value)',        getTypeFromHeapType(heaptypes[i_value],         false));
		this.#reftypeRegistry.set('(ref $Property)',     getTypeFromHeapType(heaptypes[i_property],      false));
		this.#reftypeRegistry.set('(ref $Tuple)',        getTypeFromHeapType(heaptypes[i_tuple],         false));
		this.#reftypeRegistry.set('(ref $Record)',       getTypeFromHeapType(heaptypes[i_record],        false));
		this.#reftypeRegistry.set('(ref $ListInternal)', getTypeFromHeapType(heaptypes[i_list_internal], false));
		this.#reftypeRegistry.set('(ref $DictInternal)', getTypeFromHeapType(heaptypes[i_dict_internal], false));
		this.#reftypeRegistry.set('(ref $Object)',       getTypeFromHeapType(heaptypes[i_object],        false));
		this.#reftypeRegistry.set('(ref $List)',         getTypeFromHeapType(heaptypes[i_list],          false));
		this.#reftypeRegistry.set('(ref $Dict)',         getTypeFromHeapType(heaptypes[i_dict],          false));

		this.#reftypeRegistry.set('(ref null $Value)',    getTypeFromHeapType(heaptypes[i_value],    true)); // only used as the fields of `$ListInternal`
		this.#reftypeRegistry.set('(ref null $Property)', getTypeFromHeapType(heaptypes[i_property], true)); // only used as the fields of `$DictInternal`
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

	/** assumes both operands are primitive */
	#setupBinopPrimitive(
		name:        string,
		method_ints: (int0: binaryen.ExpressionRef,   int1: binaryen.ExpressionRef)   => binaryen.ExpressionRef,
		method_flts: (float0: binaryen.ExpressionRef, float1: binaryen.ExpressionRef) => binaryen.ExpressionRef,
		comparative: boolean = false, // if true, expects method calls to return `i32`; otherwise, expects any argument to BinVect
	): binaryen.FunctionRef {
		const mod:      BinaryenModuleUpdates = this.module;
		const rt_value: binaryen.Type         = this.getReftype('(ref $Value)');
		const local_vals = [
			new BinValue(this, mod.local.get(0, rt_value)),
			new BinValue(this, mod.local.get(1, rt_value)),
		] as const;
		const local_vects = local_vals.map((binval) => new BinVect(mod, binval.primitiveValue));

		let int_int: binaryen.ExpressionRef = method_ints.call(null,                       local_vects[0].intValue,                         local_vects[1].intValue);
		let int_flt: binaryen.ExpressionRef = method_flts.call(null, mod.f64.convert_u.i32(local_vects[0].intValue),                        local_vects[1].floatValue);
		let flt_int: binaryen.ExpressionRef = method_flts.call(null,                       local_vects[0].floatValue, mod.f64.convert_u.i32(local_vects[1].intValue));
		let flt_flt: binaryen.ExpressionRef = method_flts.call(null,                       local_vects[0].floatValue,                       local_vects[1].floatValue);
		if (comparative) {
			int_int = BinVect.asBool(mod, int_int);
			int_flt = BinVect.asBool(mod, int_flt);
			flt_int = BinVect.asBool(mod, flt_int);
			flt_flt = BinVect.asBool(mod, flt_flt);
		} else {
			int_int = new BinVect(mod, int_int).vect;
			int_flt = new BinVect(mod, int_flt).vect;
			flt_int = new BinVect(mod, flt_int).vect;
			flt_flt = new BinVect(mod, flt_flt).vect;
		}
		int_int = new BinValue(this, int_int).value;
		int_flt = new BinValue(this, int_flt).value;
		flt_int = new BinValue(this, flt_int).value;
		flt_flt = new BinValue(this, flt_flt).value;

		return mod.addFunction(name, binaryen.createType([rt_value, rt_value]), rt_value, [], mod.if(
			local_vects[0].isInt,
			mod.if(
				local_vects[1].isInt,
				int_int,
				mod.if(
					local_vects[1].isFloat,
					int_flt,
					mod.unreachable(),
				),
			),
			mod.if(
				local_vects[0].isFloat,
				mod.if(
					local_vects[1].isInt,
					flt_int,
					mod.if(
						local_vects[1].isFloat,
						flt_flt,
						mod.unreachable(),
					),
				),
				mod.unreachable(),
			),
		));
	};

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


		const mod:      BinaryenModuleUpdates = this.module;
		const rt_value: binaryen.Type         = this.getReftype('(ref $Value)');
		const local_vals = [
			new BinValue(this, mod.local.get(0, rt_value)),
			new BinValue(this, mod.local.get(1, rt_value)),
		] as const;
		const local_vects = local_vals.map((binval) => new BinVect(mod, binval.primitiveValue));

		mod.addFunction('isnull_', rt_value, rt_value, [], new BinValue(this, BinVect.asBool(mod, mod.i32.and(
			local_vals[0].isPrimitive,
			local_vects[0].isSpecial(null),
		))).value);
		mod.addFunction('vnot_', rt_value, rt_value, [], new BinValue(this, BinVect.asBool(mod, mod.i32.and(
			local_vals[0].isPrimitive,
			mod.i32.or(local_vects[0].isSpecial(null), local_vects[0].isSpecial(false)),
		))).value);
		mod.addFunction('vemp_', rt_value, rt_value, [], mod.if(
			local_vals[0].isPrimitive,
			mod.if(
				local_vects[0].isSpecial(),
				mod.call('vnot_', [local_vals[0].value], rt_value),
				/* eslint-disable @stylistic/indent */
				new BinValue(this, mod.if(
					local_vects[0].isInt,
					BinVect.asBool(mod, mod.i32.eqz(local_vects[0].intValue)), // TODO: v0.5: use i64.eqz
					// mod.if(
					// 	local_vects[0].isNat,
					// 	BinVect.asBool(mod, mod.i64.eqz(local_vects[0].natValue)),
						mod.if(
							local_vects[0].isFloat,
							BinVect.asBool(mod, mod.f64.eq(local_vects[0].floatValue, mod.f64.const(0.0))), // also takes care of -0.0
							BinVect.asBool(mod, mod.i32.and(local_vects[0].isAddr, mod.i32.eqz(local_vects[0].addrValue))), // TODO: v0.5: use i64.eqz
						),
					// ),
				)).value,
				/* eslint-enable @stylistic/indent */
			),
			mod.unreachable(), // TODO: EMP operator on composites
		));
		mod.addFunction('vneg_', rt_value, rt_value, [], new BinValue(this, mod.if( // assume operand is primitive
			local_vects[0].isInt,
			// `-n` in two’s complement is `(n xor -1) + 1`
			new BinVect(mod, mod.i32.add(mod.i32.xor(local_vects[0].intValue, mod.i32.const(-1)), mod.i32.const(1))).vect,
			mod.if(
				local_vects[0].isFloat,
				new BinVect(mod, mod.f64.neg(local_vects[0].floatValue)).vect,
				mod.unreachable(), // cannot call NEG on other primitives
			),
		)).value);

		mod.addFunction('vexp_', binaryen.createType([rt_value, rt_value]), rt_value, [], mod.if( // TODO: v0.5: will be fixed in 'viexp'
			mod.i32.and(local_vects[0].isInt, local_vects[1].isInt),
			new BinValue(this, new BinVect(mod, mod.call('exp', [local_vects[0].intValue, local_vects[1].intValue], binaryen.i32))).value,
			mod.unreachable(),
		));

		this.#setupBinopPrimitive('vmul_', mod.i32.mul  .bind(null), mod.f64.mul.bind(null));
		this.#setupBinopPrimitive('vdiv_', mod.i32.div_s.bind(null), mod.f64.div.bind(null));
		this.#setupBinopPrimitive('vadd_', mod.i32.add  .bind(null), mod.f64.add.bind(null));
		this.#setupBinopPrimitive('vlt_',  mod.i32.lt_s .bind(null), mod.f64.lt .bind(null), true);
		this.#setupBinopPrimitive('vgt_',  mod.i32.gt_s .bind(null), mod.f64.gt .bind(null), true);
		this.#setupBinopPrimitive('vle_',  mod.i32.le_s .bind(null), mod.f64.le .bind(null), true);
		this.#setupBinopPrimitive('vge_',  mod.i32.ge_s .bind(null), mod.f64.ge .bind(null), true);
		this.#setupBinopPrimitive('veqn',  mod.i32.eq   .bind(null), mod.f64.eq .bind(null), true);

		this.module.addFunction('vid_', binaryen.createType([rt_value, rt_value]), rt_value, [], new BinValue(this, mod.if(
			mod.i32.and(local_vals[0].isPrimitive, local_vals[1].isPrimitive),
			mod.if(
				mod.i32.and(local_vects[0].isSpecial(), local_vects[1].isSpecial()),
				BinVect.asBool(mod, mod.i32.eq(
					mod.i16x8.extract_lane_s(local_vects[0].vect, 3), // TODO: v0.5: `.specialValue`/`.asSpecial`
					mod.i16x8.extract_lane_s(local_vects[1].vect, 3), // TODO: v0.5: `.specialValue`/`.asSpecial`
				)),
				mod.if(
					mod.i32.and(local_vects[0].isInt, local_vects[1].isInt),
					BinVect.asBool(mod, mod.i32.eq(local_vects[0].intValue, local_vects[1].intValue)), // `i32.eq` for ints gives the same result as `ID` operator
					mod.if(
						mod.i32.and(local_vects[0].isFloat, local_vects[1].isFloat),
						BinVect.asBool(mod, mod.call('fid', [local_vects[0].floatValue, local_vects[1].floatValue], binaryen.i32)),
						new BinVect(mod, false).vect,
					),
				),
			),
			BinVect.asBool(mod, mod.ref.eq(local_vals[0].compositeValue, local_vals[1].compositeValue)), // TODO: handle identity of tuples/records
		)).value);

		this.module.addFunction('veq_', binaryen.createType([rt_value, rt_value]), rt_value, [], mod.if(
			mod.i32.and(local_vals[0].isPrimitive, local_vals[1].isPrimitive),
			mod.if(
				mod.i32.or(local_vects[0].isSpecial(), local_vects[1].isSpecial()),
				mod.call('vid_', [local_vals[0].value, local_vals[1].value], rt_value),
				mod.call('veqn', [local_vals[0].value, local_vals[1].value], rt_value),
			),
			mod.call('vid_', [local_vals[0].value, local_vals[1].value], rt_value), // TODO: handle equality of all composites
		));
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
