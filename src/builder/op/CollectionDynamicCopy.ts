import * as assert from 'node:assert';
import type binaryen from 'binaryen';
import * as xjs from 'extrajs';
import type {
	CodeGenerator,
	Local,
} from '../../index.ts';
import {
	assert_instanceof,
	memoizeMethod,
	runOnceMethod,
} from '../../lib/index.ts';
import {
	VALUE,
	TYPE,
} from '../../typer/index.ts';
import type {Builder} from '../Builder.ts';
import type {Interpreter} from '../Interpreter.ts';
import {
	TypeName,
	type CollectionDynamicName,
} from './utils-public.ts';
import {OpCode} from './Opcode.ts';
import {Instruction} from './Instruction.ts';
import type {ValueTac} from './ValueTac.ts';



/** Adjusts destination capacity before copying. */
function copy_array(
	mod:     CodeGenerator['mod'],
	destobj: Local,
	destref: binaryen.ExpressionRef,
	srcref:  Local,
	adj_cap: binaryen.ExpressionRef /* void */,
): binaryen.ExpressionRef {
	return mod.block(null, [
		destobj.set(),
		srcref.set(),
		adj_cap,
		mod.array.copy(
			destref,
			mod.i32.const(0),
			srcref.get(),
			mod.i32.const(0),
			mod.array.len(srcref.get()),
		),
	]);
}



/** Perform a set (insert) for each item. */
function each_item(
	cg:         CodeGenerator,
	destobj:    Local,
	srcref:     Local,
	itemtype:   binaryen.Type,
	check_null: boolean,
	when_item_is_non_null: (dest_get: binaryen.ExpressionRef, item_get: binaryen.ExpressionRef) => binaryen.ExpressionRef,
): binaryen.ExpressionRef {
	const {mod} = cg;

	// HACK: Temporary counter until we get CodeGenerator blocks.
	if (!('blockCount' in cg)) {
		Reflect.defineProperty(cg, 'blockCount', {enumerable: true, writable: true, value: 0n});
	}
	const block_n: bigint = Reflect.get(cg, 'blockCount') as bigint;
	Reflect.set(cg, 'blockCount', block_n + 1n);

	const i:    Local = cg.newLocal(mod.i32.const(0));
	const item: Local = cg.newLocal(mod.array.get(srcref.get(), i.get(), itemtype));

	const non_null_item: binaryen.ExpressionRef = when_item_is_non_null(destobj.get(), item.get());

	return mod.block(null, [
		destobj.set(),
		srcref.set(),
		mod.block(`exit-${ block_n }`, [
			i.set(),
			mod.loop(`repeat-${ block_n }`, mod.block(null, [
				mod.br_if(`exit-${ block_n }`, mod.i32.ge_u(i.get(), mod.array.len(srcref.get()))),
				item.set(),
				check_null
					? mod.if(mod.i32.eqz(mod.ref.is_null(item.get())), non_null_item)
					: non_null_item,
				i.inc(),
				mod.br(`repeat-${ block_n }`),
			])),
		]),
	]);
}



/**
 * Converts a two-tuple key–value pair into the fields of a `$Property` for Dict insertion.
 * The pair given must be a `$Tuple` that has two `$Value`s:
 * one representing a Counterpoint value of type `sym`, followed by one representing any Counterpoint value.
 * This method creates the fields of a `$Property` by using the symbol ID as the key, and the second component as the value.
 *
 * Example:
 * ```
 * ;; argument:
 * (array.new_fixed $Tuple 2
 * 	(call $Value.new-primitive (call $Vect.new-nat <sym>)) ;; CPL type `sym`
 * 	<$Value> ;; any CPL value, primitive or composite
 * )
 * ;; returns the fields of:
 * (struct.new $Property
 * 	(i64.const <sym_key>)
 * 	<$Value>
 * )
 * ```
 * @param cg   code-generator
 * @param pair a `$Tuple` containing 2 `$Value`s
 * @return     the key and value of the `$Property`
 */
function two_tuple_to_prop(cg: CodeGenerator, pair: Local): {key: binaryen.ExpressionRef, val: binaryen.ExpressionRef} {
	return {
		key: cg.vm.Vect.asNat(cg.vm.Value.field(cg.mod.array.get(pair.tee(), cg.mod.i32.const(0), cg.vm.reftype.Value)).primitive),
		val: cg.mod.array.get(pair.get(), cg.mod.i32.const(1), cg.vm.reftype.Value),
	};
}



/**
 * Converts a `$Case` into the fields of a `$Property` for Dict insertion.
 * The `$Case` given must have an antecedent representing a Counterpoint value of type `sym`,
 * and a consequent representing any Counterpoint value.
 * This method creates the fields of a `$Property` by using the symbol ID as the key, and the consequent as the value.
 *
 * Example:
 * ```
 * ;; argument:
 * (struct.new $Case
 * 	(call $Value.new-primitive (call $Vect.new-nat <sym>)) ;; CPL type `sym`
 * 	<$Value> ;; any CPL value, primitive or composite
 * )
 * ;; returns the fields of:
 * (struct.new $Property
 * 	(i64.const <sym_key>)
 * 	<$Value>
 * )
 * ```
 * @param cg    code-generator
 * @param case_ a `$Case` whose `$ant` represents a Counterpoint Symbol
 * @return      the key and value of the `$Property`
 */
function case_to_prop(cg: CodeGenerator, case_: binaryen.ExpressionRef): {key: binaryen.ExpressionRef, val: binaryen.ExpressionRef} {
	return {
		key: cg.vm.Vect.asNat(cg.vm.Value.field(cg.vm.Case.field(case_).ant).primitive),
		val: cg.vm.Case.field(case_).con,
	};
}



/**
 * Converts a two-tuple antecedent–consequent pair into the fields of a `$Case` for Map insertion.
 * The pair given must be a `$Tuple` that has two `$Value`s.
 * This method creates the fields of a `$Case` by using the components of the tuple.
 *
 * Example:
 * ```
 * ;; argument:
 * (array.new_fixed $Tuple 2
 * 	<$Value 'ant'> ;; any CPL value, primitive or composite
 * 	<$Value 'con'> ;; any CPL value, primitive or composite
 * )
 * ;; returns the fields of:
 * (struct.new $Case
 * 	<$Value 'ant'>
 * 	<$Value 'con'>
 * )
 * ```
 * @param cg   code-generator
 * @param pair a `$Tuple` containing 2 `$Value`s
 * @return     the antecedent and consequent of a new `$Case`
 */
function two_tuple_to_case(cg: CodeGenerator, pair: Local): {ant: binaryen.ExpressionRef, con: binaryen.ExpressionRef} {
	return {
		ant: cg.mod.array.get(pair.tee(), cg.mod.i32.const(0), cg.vm.reftype.Value),
		con: cg.mod.array.get(pair.get(), cg.mod.i32.const(1), cg.vm.reftype.Value),
	};
}



/** Copy an existing collection into a dynamic collection (List/Dict/Set/Map). */
export class CollectionDynamicCopy extends Instruction {
	public constructor(
		private readonly name:        CollectionDynamicName,
		private readonly destination: ValueTac,
		private readonly source:      ValueTac,
	) {
		super(new Map<typeof name, OpCode>([
			[TypeName.LIST, OpCode.LIST_COPY],
			[TypeName.DICT, OpCode.DICT_COPY],
			[TypeName.SET,  OpCode.SET_COPY],
			[TypeName.MAP,  OpCode.MAP_COPY],
		]).get(name)!);
	}

	public override toString(): string {
		return super.toString(this.destination, this.source);
	}

	@runOnceMethod
	public override validate(builder: Builder): void {
		xjs.Array.forEachAggregated([this.destination, this.source], (value) => value.validate(builder));
		switch (this.name) {
			case TypeName.LIST: {
				assert_instanceof(this.destination.type, TYPE.List);
				return assert.ok([TYPE.Tuple, TYPE.List, TYPE.Set].some((typ) => this.source.type instanceof typ));
			}
			case TypeName.DICT: {
				assert_instanceof(this.destination.type, TYPE.Dict);
				return assert.ok([TYPE.Tuple, TYPE.Record, TYPE.List, TYPE.Dict, TYPE.Set, TYPE.Map].some((typ) => this.source.type instanceof typ));
			}
			case TypeName.SET: {
				assert_instanceof(this.destination.type, TYPE.Set);
				return assert.ok([TYPE.Tuple, TYPE.List, TYPE.Set].some((typ) => this.source.type instanceof typ));
			}
			case TypeName.MAP: {
				assert_instanceof(this.destination.type, TYPE.Map);
				return assert.ok([TYPE.Tuple, TYPE.List, TYPE.Set, TYPE.Map].some((typ) => this.source.type instanceof typ));
			}
		}
	}

	public override interpret(interp: Interpreter): void {
		const dest: VALUE.Value = this.destination.interpret(interp);
		const src:  VALUE.Value = this.source     .interpret(interp);
		switch (this.name) {
			case TypeName.LIST: {
				assert_instanceof(dest, VALUE.List);
				dest.clear();
				switch (true) {
					// List.<T>((t, t, t));
					// List.<T>([t, t, t]);
					// List.<T>(List.<T>((t, t, t)));
					case src instanceof VALUE.CollectionIndexed: {
						return src.items.forEach((it, i) => dest.set(BigInt(i), it));
					}
					// List.<T>({t, t, t});
					// List.<T>(Set.<T>((t, t, t)));
					case src instanceof VALUE.Set: {
						return src.elements.forEach((el, i) => dest.set(BigInt(i), el));
					}
					default: {
						throw new TypeError(`Expected \`${ src }\` to be of type \`Tuple | List | Set\`.`);
					}
				}
			}
			case TypeName.DICT: {
				assert_instanceof(dest, VALUE.Dict);
				dest.clear();
				switch (true) {
					// Dict.<T>(( (@a, t), (@b, t), (@c, t) ));
					// Dict.<T>([ (@a, t), (@b, t), (@c, t) ]);
					// Dict.<T>(List.<(sym, T)>(( (@a, t), (@b, t), (@c, t) )));
					case src instanceof VALUE.CollectionIndexed: {
						return src.items.forEach((it) => dest.set(
							((it as VALUE.Tuple).get(0n) as VALUE.Symbol).id,
							(it as VALUE.Tuple).get(1n),
						));
					}
					// Dict.<T>((a= t, b= t, c= t));
					// Dict.<T>([a= t, b= t, c= t]);
					// Dict.<T>(Dict.<T>( (a= t, b= t, c= t) ));
					case src instanceof VALUE.CollectionKeyed: {
						return src.properties.forEach((val, keyid) => dest.set(keyid, val));
					}
					// Dict.<T>({ (@a, t), (@b, t), (@c, t) });
					// Dict.<T>(Set.<(sym, T)>(( (@a, t), (@b, t), (@c, t) )));
					case src instanceof VALUE.Set: {
						return src.elements.forEach((el) => dest.set(
							((el as VALUE.Tuple).get(0n) as VALUE.Symbol).id,
							(el as VALUE.Tuple).get(1n),
						));
					}
					// Dict.<T>({@a -> t, @b -> t, @c -> t});
					// Dict.<T>(Map.<sym, T>(( (@a, t), (@b, t), (@c, t) )));
					case src instanceof VALUE.Map: {
						return src.cases.forEach((val, key) => dest.set((key as VALUE.Symbol).id, val));
					}
					default: {
						throw new TypeError(`Expected \`${ src }\` to be of type \`Tuple | Record | List | Dict | Set | Map\`.`);
					}
				}
			}
			case TypeName.SET: {
				assert_instanceof(dest, VALUE.Set);
				dest.clear();
				switch (true) {
					// Set.<T>((t, t, t));
					// Set.<T>([t, t, t]);
					// Set.<T>(List.<T>((t, t, t)));
					case src instanceof VALUE.CollectionIndexed: {
						return src.items.forEach((it) => dest.put(it));
					}
					// Set.<T>({t, t, t});
					// Set.<T>(Set.<T>((t, t, t)));
					case src instanceof VALUE.Set: {
						return src.elements.forEach((el) => dest.put(el));
					}
					default: {
						throw new TypeError(`Expected \`${ src }\` to be of type \`Tuple | List | Set\`.`);
					}
				}
			}
			case TypeName.MAP: {
				assert_instanceof(dest, VALUE.Map);
				dest.clear();
				switch (true) {
					// Map.<K, V>(( (k, v), (k, v), (k, v) ));
					// Map.<K, V>([ (k, v), (k, v), (k, v) ]);
					// Map.<K, V>(List.<(K, V)>(( (k, v), (k, v), (k, v) )));
					case src instanceof VALUE.CollectionIndexed: {
						return src.items.forEach((it) => dest.set(
							(it as VALUE.Tuple).get(0n),
							(it as VALUE.Tuple).get(1n),
						));
					}
					// Map.<K, V>({ (k, v), (k, v), (k, v) });
					// Map.<K, V>(Set.<(K, V)>(( (k, v), (k, v), (k, v) )));
					case src instanceof VALUE.Set: {
						return src.elements.forEach((el) => dest.set(
							(el as VALUE.Tuple).get(0n),
							(el as VALUE.Tuple).get(1n),
						));
					}
					// Map.<K, V>({k -> v, k -> v, k -> v});
					// Map.<K, V>(Map.<K, V>(( (k, v), (k, v), (k, v) )));
					case src instanceof VALUE.Map: {
						return src.cases.forEach((val, key) => dest.set(key, val));
					}
					default: {
						throw new TypeError(`Expected \`${ src }\` to be of type \`Tuple | List | Set | Map\`.`);
					}
				}
			}
		}
	}

	@memoizeMethod
	public override codegen(cg: CodeGenerator): binaryen.ExpressionRef {
		const {vm: {reftype, reftypeNull, util, Value, Case, List, Dict, Map: VmMap}, mod} = cg;

		const code_dest: binaryen.ExpressionRef = this.destination.codegen(cg);
		const code_src:  binaryen.ExpressionRef = this.source     .codegen(cg);

		switch (this.name) {
			case TypeName.LIST: {
				const destlist: Local = cg.newLocal(Value.cast(code_dest, reftype.List));
				switch (true) { // using `ast_type_name()` is too expensive
					// List.<T>((t, t, t));
					case this.source.type instanceof TYPE.Tuple: {
						const srcref: Local = cg.newLocal(Value.cast(code_src, reftype.Tuple));
						return copy_array(
							mod,
							destlist,
							List.field(destlist.get()).internal,
							srcref,
							List.adjustCapacity(destlist.get(), util.capacityNeeded(mod.array.len(srcref.get()))),
						);
					}
					// List.<T>([t, t, t]);
					// List.<T>(List.<T>((t, t, t)));
					case this.source.type instanceof TYPE.List: {
						const srcref: Local = cg.newLocal(List.field(Value.cast(code_src, reftype.List)).internal, reftype.ListInternal);
						return copy_array(
							mod,
							destlist,
							List.field(destlist.get()).internal,
							srcref,
							List.adjustCapacity(destlist.get(), mod.array.len(srcref.get())),
						);
					}
					// List.<T>({t, t, t});
					// List.<T>(Set.<T>((t, t, t)));
					case this.source.type instanceof TYPE.Set: {
						/*
						 * NOTE: This method iterates over the Set in internal array order, and inserts them into the List in that order.
						 * The items in the resulting List do not necessarily appear in the same order as they were inserted into the Set.
						 * This may be surprising to programmers who expect the copy to preserve order;
						 * however, Set semantics explicitly state that programmers should not expect iteration to occur in any particular order.
						 */
						const srcref: Local = cg.newLocal(VmMap.field(Value.cast(code_src, reftype.Map)).internal, reftype.MapInternal);
						const j:      Local = cg.newLocal(mod.i32.const(0));
						return mod.block(null, [
							j.set(),
							each_item(cg, destlist, srcref, reftypeNull.Case, true, (dest_get, item_get) => mod.block(null, [
								List.set(dest_get, j.get(), Case.field(item_get).ant),
								j.inc(),
							])),
						]);
					}
					default: {
						return assert.fail(`Expected \`${ this.source }\` to pass validation.`);
					}
				}
			}
			case TypeName.DICT: {
				const destdict: Local = cg.newLocal(Value.cast(code_dest, reftype.Dict));
				switch (true) { // using `ast_type_name()` is too expensive
					// Dict.<T>(( (@a, t), (@b, t), (@c, t) ));
					case this.source.type instanceof TYPE.Tuple: {
						const srcref: Local = cg.newLocal(Value.cast(code_src, reftype.Tuple));
						return each_item(cg, destdict, srcref, reftype.Value, false, (dest_get, item_get) => {
							const {key, val} = two_tuple_to_prop(cg, cg.newLocal(Value.cast(item_get, reftype.Tuple)));
							return Dict.set(dest_get, key, val);
						});
					}
					// Dict.<T>((a= t, b= t, c= t));
					case this.source.type instanceof TYPE.Record: {
						const srcref: Local = cg.newLocal(Value.cast(code_src, reftype.Record));
						return copy_array(
							mod,
							destdict,
							Dict.field(destdict.get()).internal,
							srcref,
							Dict.adjustCapacity(destdict.get(), util.capacityNeeded(mod.array.len(srcref.get()))),
						);
					}
					// Dict.<T>([ (@a, t), (@b, t), (@c, t) ]);
					// Dict.<T>(List.<(sym, T)>(( (@a, t), (@b, t), (@c, t) )));
					case this.source.type instanceof TYPE.List: {
						const srcref: Local = cg.newLocal(List.field(Value.cast(code_src, reftype.List)).internal, reftype.ListInternal);
						return each_item(cg, destdict, srcref, reftypeNull.Value, true, (dest_get, item_get) => {
							const {key, val} = two_tuple_to_prop(cg, cg.newLocal(Value.cast(item_get, reftype.Tuple)));
							return Dict.set(dest_get, key, val);
						});
					}
					// Dict.<T>([a= t, b= t, c= t]);
					// Dict.<T>(Dict.<T>( (a= t, b= t, c= t) ));
					case this.source.type instanceof TYPE.Dict: {
						const srcref: Local = cg.newLocal(Dict.field(Value.cast(code_src, reftype.Dict)).internal, reftype.DictInternal);
						return copy_array(
							mod,
							destdict,
							Dict.field(destdict.get()).internal,
							srcref,
							Dict.adjustCapacity(destdict.get(), mod.array.len(srcref.get())),
						);
					}
					// Dict.<T>({ (@a, t), (@b, t), (@c, t) });
					// Dict.<T>(Set.<(sym, T)>(( (@a, t), (@b, t), (@c, t) )));
					case this.source.type instanceof TYPE.Set: {
						const srcref: Local = cg.newLocal(VmMap.field(Value.cast(code_src, reftype.Map)).internal, reftype.MapInternal);
						return each_item(cg, destdict, srcref, reftypeNull.Case, true, (dest_get, item_get) => {
							const {key, val} = two_tuple_to_prop(cg, cg.newLocal(Value.cast(Case.field(item_get).ant, reftype.Tuple)));
							return Dict.set(dest_get, key, val);
						});
					}
					// Dict.<T>({@a -> t, @b -> t, @c -> t});
					// Dict.<T>(Map.<sym, T>(( (@a, t), (@b, t), (@c, t) )));
					case this.source.type instanceof TYPE.Map: {
						const srcref: Local = cg.newLocal(VmMap.field(Value.cast(code_src, reftype.Map)).internal, reftype.MapInternal);
						return each_item(cg, destdict, srcref, reftypeNull.Case, true, (dest_get, item_get) => {
							const {key, val} = case_to_prop(cg, item_get);
							return Dict.set(dest_get, key, val);
						});
					}
					default: {
						return assert.fail(`Expected \`${ this.source }\` to pass validation.`);
					}
				}
			}
			case TypeName.SET: {
				const destset: Local = cg.newLocal(Value.cast(code_dest, reftype.Map));
				switch (true) { // using `ast_type_name()` is too expensive
					// Set.<T>((t, t, t));
					case this.source.type instanceof TYPE.Tuple: {
						const srcref: Local = cg.newLocal(Value.cast(code_src, reftype.Tuple));
						return each_item(cg, destset, srcref, reftype.Value, false, (dest_get, item_get) => VmMap.set(
							dest_get,
							item_get,
							cg.getConst(null),
						));
					}
					// Set.<T>([t, t, t]);
					// Set.<T>(List.<T>((t, t, t)));
					case this.source.type instanceof TYPE.List: {
						const srcref: Local = cg.newLocal(List.field(Value.cast(code_src, reftype.List)).internal, reftype.ListInternal);
						return each_item(cg, destset, srcref, reftypeNull.Value, true, (dest_get, item_get) => VmMap.set(
							dest_get,
							mod.ref.as_non_null(item_get),
							cg.getConst(null),
						));
					}
					// Set.<T>({t, t, t});
					// Set.<T>(Set.<T>((t, t, t)));
					case this.source.type instanceof TYPE.Set: {
						const srcref: Local = cg.newLocal(VmMap.field(Value.cast(code_src, reftype.Map)).internal, reftype.MapInternal);
						return copy_array(
							mod,
							destset,
							VmMap.field(destset.get()).internal,
							srcref,
							VmMap.adjustCapacity(destset.get(), mod.array.len(srcref.get())),
						);
					}
					default: {
						return assert.fail(`Expected \`${ this.source }\` to pass validation.`);
					}
				}
			}
			case TypeName.MAP: {
				const destmap: Local = cg.newLocal(Value.cast(code_dest, reftype.Map));
				switch (true) { // using `ast_type_name()` is too expensive
					// Map.<K, V>(( (k, v), (k, v), (k, v) ));
					case this.source.type instanceof TYPE.Tuple: {
						const srcref: Local = cg.newLocal(Value.cast(code_src, reftype.Tuple));
						return each_item(cg, destmap, srcref, reftype.Value, false, (dest_get, item_get) => {
							const {ant, con} = two_tuple_to_case(cg, cg.newLocal(Value.cast(item_get, reftype.Tuple)));
							return VmMap.set(dest_get, ant, con);
						});
					}
					// Map.<K, V>([ (k, v), (k, v), (k, v) ]);
					// Map.<K, V>(List.<(K, V)>(( (k, v), (k, v), (k, v) )));
					case this.source.type instanceof TYPE.List: {
						const srcref: Local = cg.newLocal(List.field(Value.cast(code_src, reftype.List)).internal, reftype.ListInternal);
						return each_item(cg, destmap, srcref, reftypeNull.Value, true, (dest_get, item_get) => {
							const {ant, con} = two_tuple_to_case(cg, cg.newLocal(Value.cast(item_get, reftype.Tuple)));
							return VmMap.set(dest_get, ant, con);
						});
					}
					// Map.<K, V>({ (k, v), (k, v), (k, v) });
					// Map.<K, V>(Set.<(K, V)>(( (k, v), (k, v), (k, v) )));
					case this.source.type instanceof TYPE.Set: {
						const srcref: Local = cg.newLocal(VmMap.field(Value.cast(code_src, reftype.Map)).internal, reftype.MapInternal);
						return each_item(cg, destmap, srcref, reftypeNull.Case, true, (dest_get, item_get) => {
							const {ant, con} = two_tuple_to_case(cg, cg.newLocal(Value.cast(Case.field(item_get).ant, reftype.Tuple)));
							return VmMap.set(dest_get, ant, con);
						});
					}
					// Map.<K, V>({k -> v, k -> v, k -> v});
					// Map.<K, V>(Map.<K, V>(( (k, v), (k, v), (k, v) )));
					case this.source.type instanceof TYPE.Map: {
						const srcref: Local = cg.newLocal(VmMap.field(Value.cast(code_src, reftype.Map)).internal, reftype.MapInternal);
						return copy_array(
							mod,
							destmap,
							VmMap.field(destmap.get()).internal,
							srcref,
							VmMap.adjustCapacity(destmap.get(), mod.array.len(srcref.get())),
						);
					}
					default: {
						return assert.fail(`Expected \`${ this.source }\` to pass validation.`);
					}
				}
			}
		}
	}
}
