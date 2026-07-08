import * as assert from 'node:assert';
import type * as binaryen from 'binaryen.ts';
import * as xjs from 'extrajs';
import {
	BinConst,
	type CodeGenerator,
	type Local,
} from '../../index.ts';
import {
	assert_instanceof,
	memoizeMethod,
	runOnceMethod,
} from '../../lib/index.ts';
import {TYPE} from '../../typer/index.ts';
import {
	TypeName,
	type CollectionDynamicName,
} from './utils-public.ts';
import {OpCode} from './Opcode.ts';
import {Instruction} from './Instruction.ts';
import type {ValueTac} from './ValueTac.ts';



/** Adjusts destination capacity before copying. */
function copy_array(
	wasm:    binaryen.ExpressionBuilder,
	destobj: Local,
	destref: binaryen.ExpressionRef,
	srcref:  Local,
	adj_cap: binaryen.ExpressionRef /* void */,
): binaryen.ExpressionRef {
	return wasm.block(null, [
		destobj.set(),
		srcref.set(),
		adj_cap,
		wasm.array.copy(
			destref,
			wasm.i32.const(0),
			srcref.get(),
			wasm.i32.const(0),
			wasm.array.len(srcref.get()),
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
	const {wasm} = cg.mod;

	// HACK: Temporary counter until we get CodeGenerator blocks.
	if (!('blockCount' in cg)) {
		Reflect.defineProperty(cg, 'blockCount', {enumerable: true, writable: true, value: 0n});
	}
	const block_n: bigint = Reflect.get(cg, 'blockCount') as bigint;
	Reflect.set(cg, 'blockCount', block_n + 1n);

	const i:    Local = cg.newLocal(wasm.i32.const(0));
	const item: Local = cg.newLocal(wasm.array.get(srcref.get(), i.get(), itemtype));

	const non_null_item: binaryen.ExpressionRef = when_item_is_non_null(destobj.get(), item.get());

	return wasm.block(null, [
		destobj.set(),
		srcref.set(),
		wasm.block(`exit-${ block_n }`, [
			i.set(),
			wasm.loop(`repeat-${ block_n }`, wasm.block(null, [
				wasm.br_if(`exit-${ block_n }`, wasm.i32.ge_u(i.get(), wasm.array.len(srcref.get()))),
				item.set(),
				check_null
					? wasm.if(wasm.i32.eqz(wasm.ref.is_null(item.get())), non_null_item)
					: non_null_item,
				i.inc(),
				wasm.br(`repeat-${ block_n }`),
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
		key: cg.vm.Vect.asNat(cg.vm.Value.field(cg.mod.wasm.array.get(pair.tee(), cg.mod.wasm.i32.const(0), cg.vm.reftype.Value)).primitive),
		val: cg.mod.wasm.array.get(pair.get(), cg.mod.wasm.i32.const(1), cg.vm.reftype.Value),
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
		ant: cg.mod.wasm.array.get(pair.tee(), cg.mod.wasm.i32.const(0), cg.vm.reftype.Value),
		con: cg.mod.wasm.array.get(pair.get(), cg.mod.wasm.i32.const(1), cg.vm.reftype.Value),
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
	public override validate(): void {
		xjs.Array.forEachAggregated([this.destination, this.source], (value) => value.validate());
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

	@memoizeMethod
	public override codegen(cg: CodeGenerator): binaryen.ExpressionRef {
		const {vm: {reftype, reftypeNull, util, Value, Case, List, Dict, Map: VmMap}, mod: {wasm}} = cg;

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
							wasm,
							destlist,
							List.field(destlist.get()).internal,
							srcref,
							List.adjustCapacity(destlist.get(), util.capacityNeeded(wasm.array.len(srcref.get()))),
						);
					}
					// List.<T>(List.<T>((t, t, t)));
					// List.<T>([t, t, t]);
					case this.source.type instanceof TYPE.List: {
						const srcref: Local = cg.newLocal(List.field(Value.cast(code_src, reftype.List)).internal, reftype.ListInternal);
						return copy_array(
							wasm,
							destlist,
							List.field(destlist.get()).internal,
							srcref,
							List.adjustCapacity(destlist.get(), wasm.array.len(srcref.get())),
						);
					}
					// List.<T>(Set.<T>((t, t, t)));
					// List.<T>({t, t, t});
					case this.source.type instanceof TYPE.Set: {
						/*
						 * NOTE: This method iterates over the Set in internal array order, and inserts them into the List in that order.
						 * The items in the resulting List do not necessarily appear in the same order as they were inserted into the Set.
						 * This may be surprising to programmers who expect the copy to preserve order;
						 * however, Set semantics explicitly state that programmers should not expect iteration to occur in any particular order.
						 */
						const srcref: Local = cg.newLocal(VmMap.field(Value.cast(code_src, reftype.Map)).internal, reftype.MapInternal);
						const j:      Local = cg.newLocal(wasm.i32.const(0));
						return wasm.block(null, [
							j.set(),
							each_item(cg, destlist, srcref, reftypeNull.Case, true, (dest_get, item_get) => wasm.block(null, [
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
							wasm,
							destdict,
							Dict.field(destdict.get()).internal,
							srcref,
							Dict.adjustCapacity(destdict.get(), util.capacityNeeded(wasm.array.len(srcref.get()))),
						);
					}
					// Dict.<T>(List.<(sym, T)>(( (@a, t), (@b, t), (@c, t) )));
					// Dict.<T>([ (@a, t), (@b, t), (@c, t) ]);
					case this.source.type instanceof TYPE.List: {
						const srcref: Local = cg.newLocal(List.field(Value.cast(code_src, reftype.List)).internal, reftype.ListInternal);
						return each_item(cg, destdict, srcref, reftypeNull.Value, true, (dest_get, item_get) => {
							const {key, val} = two_tuple_to_prop(cg, cg.newLocal(Value.cast(item_get, reftype.Tuple)));
							return Dict.set(dest_get, key, val);
						});
					}
					// Dict.<T>(Dict.<T>( (a= t, b= t, c= t) ));
					// Dict.<T>([a= t, b= t, c= t]);
					case this.source.type instanceof TYPE.Dict: {
						const srcref: Local = cg.newLocal(Dict.field(Value.cast(code_src, reftype.Dict)).internal, reftype.DictInternal);
						return copy_array(
							wasm,
							destdict,
							Dict.field(destdict.get()).internal,
							srcref,
							Dict.adjustCapacity(destdict.get(), wasm.array.len(srcref.get())),
						);
					}
					// Dict.<T>(Set.<(sym, T)>(( (@a, t), (@b, t), (@c, t) )));
					// Dict.<T>({ (@a, t), (@b, t), (@c, t) });
					case this.source.type instanceof TYPE.Set: {
						const srcref: Local = cg.newLocal(VmMap.field(Value.cast(code_src, reftype.Map)).internal, reftype.MapInternal);
						return each_item(cg, destdict, srcref, reftypeNull.Case, true, (dest_get, item_get) => {
							const {key, val} = two_tuple_to_prop(cg, cg.newLocal(Value.cast(Case.field(item_get).ant, reftype.Tuple)));
							return Dict.set(dest_get, key, val);
						});
					}
					// Dict.<T>(Map.<sym, T>(( (@a, t), (@b, t), (@c, t) )));
					// Dict.<T>({@a -> t, @b -> t, @c -> t});
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
							cg.getConst(BinConst.NULL),
						));
					}
					// Set.<T>(List.<T>((t, t, t)));
					// Set.<T>([t, t, t]);
					case this.source.type instanceof TYPE.List: {
						const srcref: Local = cg.newLocal(List.field(Value.cast(code_src, reftype.List)).internal, reftype.ListInternal);
						return each_item(cg, destset, srcref, reftypeNull.Value, true, (dest_get, item_get) => VmMap.set(
							dest_get,
							wasm.ref.as_non_null(item_get),
							cg.getConst(BinConst.NULL),
						));
					}
					// Set.<T>(Set.<T>((t, t, t)));
					// Set.<T>({t, t, t});
					case this.source.type instanceof TYPE.Set: {
						const srcref: Local = cg.newLocal(VmMap.field(Value.cast(code_src, reftype.Map)).internal, reftype.MapInternal);
						return copy_array(
							wasm,
							destset,
							VmMap.field(destset.get()).internal,
							srcref,
							VmMap.adjustCapacity(destset.get(), wasm.array.len(srcref.get())),
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
					// Map.<K, V>(List.<(K, V)>(( (k, v), (k, v), (k, v) )));
					// Map.<K, V>([ (k, v), (k, v), (k, v) ]);
					case this.source.type instanceof TYPE.List: {
						const srcref: Local = cg.newLocal(List.field(Value.cast(code_src, reftype.List)).internal, reftype.ListInternal);
						return each_item(cg, destmap, srcref, reftypeNull.Value, true, (dest_get, item_get) => {
							const {ant, con} = two_tuple_to_case(cg, cg.newLocal(Value.cast(item_get, reftype.Tuple)));
							return VmMap.set(dest_get, ant, con);
						});
					}
					// Map.<K, V>(Set.<(K, V)>(( (k, v), (k, v), (k, v) )));
					// Map.<K, V>({ (k, v), (k, v), (k, v) });
					case this.source.type instanceof TYPE.Set: {
						const srcref: Local = cg.newLocal(VmMap.field(Value.cast(code_src, reftype.Map)).internal, reftype.MapInternal);
						return each_item(cg, destmap, srcref, reftypeNull.Case, true, (dest_get, item_get) => {
							const {ant, con} = two_tuple_to_case(cg, cg.newLocal(Value.cast(Case.field(item_get).ant, reftype.Tuple)));
							return VmMap.set(dest_get, ant, con);
						});
					}
					// Map.<K, V>(Map.<K, V>(( (k, v), (k, v), (k, v) )));
					// Map.<K, V>({k -> v, k -> v, k -> v});
					case this.source.type instanceof TYPE.Map: {
						const srcref: Local = cg.newLocal(VmMap.field(Value.cast(code_src, reftype.Map)).internal, reftype.MapInternal);
						return copy_array(
							wasm,
							destmap,
							VmMap.field(destmap.get()).internal,
							srcref,
							VmMap.adjustCapacity(destmap.get(), wasm.array.len(srcref.get())),
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
