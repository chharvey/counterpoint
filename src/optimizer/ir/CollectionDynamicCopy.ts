import * as assert from 'node:assert';
import binaryen from 'binaryen';
import * as xjs from 'extrajs';
import {
	BinValue,
	BinConst,
	type Builder,
	type Local,
} from '../../index.ts';
import {
	assert_instanceof,
	memoizeMethod,
	runOnceMethod,
} from '../../lib/index.ts';
import {TYPE} from '../../typer/index.ts';
import type {CollectionDynamicName} from './utils-public.ts';
import type {Instruction} from './Instruction.ts';
import {
	OpCode,
	Opcode,
} from './Opcode.ts';
import {TypeName} from './TypeName.ts';
import type {Value} from './Value.ts';



/** Adjusts destination capacity before copying. */
function copy_array(
	mod:          Builder['module'],
	destobj:      Local,
	destref:      binaryen.ExpressionRef,
	srcref:       Local,
	adj_cap_name: string,
	cap_needed:   binaryen.ExpressionRef,
): binaryen.ExpressionRef {
	return mod.block(null, [
		destobj.set(),
		srcref.set(),
		mod.call(adj_cap_name, [
			destobj.get(),
			cap_needed,
		], binaryen.none),
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
	cg:         Builder,
	destobj:    Local,
	srcref:     Local,
	itemtype:   binaryen.Type,
	check_null: boolean,
	when_item_is_non_null: (dest_get: binaryen.ExpressionRef, item_get: binaryen.ExpressionRef) => binaryen.ExpressionRef,
): binaryen.ExpressionRef {
	// HACK: Temporary counter until we get CodeGenerator blocks.
	if (!('blockCount' in cg)) {
		Reflect.defineProperty(cg, 'blockCount', {enumerable: true, writable: true, value: 0n});
	}
	const block_n: bigint = Reflect.get(cg, 'blockCount') as bigint;
	Reflect.set(cg, 'blockCount', block_n + 1n);

	const i:    Local = cg.newLocal(cg.module.i32.const(0));
	const item: Local = cg.newLocal(cg.module.array.get(srcref.get(), i.get(), itemtype));

	const non_null_item: binaryen.ExpressionRef = when_item_is_non_null(destobj.get(), item.get());

	return cg.module.block(null, [
		destobj.set(),
		srcref.set(),
		cg.module.block(`exit-${ block_n }`, [
			i.set(),
			cg.module.loop(`repeat-${ block_n }`, cg.module.block(null, [
				cg.module.br_if(`exit-${ block_n }`, cg.module.i32.ge_u(i.get(), cg.module.array.len(srcref.get()))),
				item.set(),
				check_null
					? cg.module.if(cg.module.i32.eqz(cg.module.ref.is_null(item.get())), non_null_item)
					: non_null_item,
				i.inc(),
				cg.module.br(`repeat-${ block_n }`),
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
 * 	(struct.new $Value (i32.const 0) (v128.const i16x8 0 0 0 0x0028 <sym>) (rev.null eq)) ;; CPL type `sym`
 * 	(struct.new $Value <val>) ;; any CPL value, primitive or composite
 * )
 * ;; returns the fields of:
 * (struct.new $Property
 * 	(i64.const <sym_key>)
 * 	(struct.new $Value <val>)
 * )
 * ```
 * @param cg   code-generator
 * @param pair a `$Tuple` containing 2 `$Value`s
 * @return     the key and value of the `$Property`
 */
function two_tuple_to_prop(cg: Builder, pair: Local): {key: binaryen.ExpressionRef, val: binaryen.ExpressionRef} {
	return {
		key: new BinValue(cg, cg.module.array.get(pair.tee(), cg.module.i32.const(0), cg.reftype.Value)).interpret('asNat'),
		val: cg.module.array.get(pair.get(), cg.module.i32.const(1), cg.reftype.Value),
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
 * 	(struct.new $Value (i32.const 0) (v128.const i16x8 0 0 0 0x0028 <sym>) (rev.null eq)) ;; CPL type `sym`
 * 	(struct.new $Value <val>) ;; any CPL value, primitive or composite
 * )
 * ;; returns the fields of:
 * (struct.new $Property
 * 	(i64.const <sym_key>)
 * 	(struct.new $Value <val>)
 * )
 * ```
 * @param cg    code-generator
 * @param case_ a `$Case` whose `$ant` represents a Counterpoint Symbol
 * @return      the key and value of the `$Property`
 */
function case_to_prop(cg: Builder, case_: binaryen.ExpressionRef): {key: binaryen.ExpressionRef, val: binaryen.ExpressionRef} {
	return {
		key: new BinValue(cg, cg.structGet.case.ant(case_)).interpret('asNat'),
		val: cg.structGet.case.con(case_),
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
 * 	(struct.new $Value <ant>) ;; any CPL value, primitive or composite
 * 	(struct.new $Value <con>) ;; any CPL value, primitive or composite
 * )
 * ;; returns the fields of:
 * (struct.new $Case
 * 	(struct.new $Value <ant>)
 * 	(struct.new $Value <con>)
 * )
 * ```
 * @param cg   code-generator
 * @param pair a `$Tuple` containing 2 `$Value`s
 * @return     the antecedent and consequent of a new `$Case`
 */
function two_tuple_to_case(cg: Builder, pair: Local): {ant: binaryen.ExpressionRef, con: binaryen.ExpressionRef} {
	return {
		ant: cg.module.array.get(pair.tee(), cg.module.i32.const(0), cg.reftype.Value),
		con: cg.module.array.get(pair.get(), cg.module.i32.const(1), cg.reftype.Value),
	};
}



/** Copy an existing collection into a dynamic collection (List/Dict/Set/Map). */
export class CollectionDynamicCopy extends Opcode implements Instruction {
	public constructor(
		private readonly name:        CollectionDynamicName,
		private readonly destination: Value,
		private readonly source:      Value,
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
	public override codegen(cg: Builder): binaryen.ExpressionRef {
		const code_dest: binaryen.ExpressionRef = this.destination.codegen(cg);
		const code_src:  binaryen.ExpressionRef = this.source     .codegen(cg);

		switch (this.name) {
			case TypeName.LIST: {
				const destlist: Local = cg.newLocal(new BinValue(cg, code_dest).cast(cg.reftype.List));
				switch (true) { // using `ast_type_name()` is too expensive
					// List.<T>((t, t, t));
					case this.source.type instanceof TYPE.Tuple: {
						const srcref: Local = cg.newLocal(new BinValue(cg, code_src).cast(cg.reftype.Tuple));
						return copy_array(
							cg.module,
							destlist,
							cg.structGet.list.internal(destlist.get()),
							srcref,
							'List.adjust-capacity',
							cg.module.call('capacity-needed', [cg.module.array.len(srcref.get())], binaryen.i32),
						);
					}
					// List.<T>(List.<T>((t, t, t)));
					// List.<T>([t, t, t]);
					case this.source.type instanceof TYPE.List: {
						const srcref: Local = cg.newLocal(cg.structGet.list.internal(new BinValue(cg, code_src).cast(cg.reftype.List)), cg.reftype.ListInternal);
						return copy_array(
							cg.module,
							destlist,
							cg.structGet.list.internal(destlist.get()),
							srcref,
							'List.adjust-capacity',
							cg.module.array.len(srcref.get()),
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
						const srcref: Local = cg.newLocal(cg.structGet.map.internal(new BinValue(cg, code_src).cast(cg.reftype.Map)), cg.reftype.MapInternal);
						const j:      Local = cg.newLocal(cg.module.i32.const(0));
						return cg.module.block(null, [
							j.set(),
							each_item(cg, destlist, srcref, cg.reftypeNull.Case, true, (dest_get, item_get) => cg.module.block(null, [
								cg.module.call('List.set', [
									dest_get,
									j.get(),
									cg.structGet.case.ant(item_get),
								], binaryen.none),
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
				const destdict: Local = cg.newLocal(new BinValue(cg, code_dest).cast(cg.reftype.Dict));
				switch (true) { // using `ast_type_name()` is too expensive
					// Dict.<T>(( (@a, t), (@b, t), (@c, t) ));
					case this.source.type instanceof TYPE.Tuple: {
						const srcref: Local = cg.newLocal(new BinValue(cg, code_src).cast(cg.reftype.Tuple));
						return each_item(cg, destdict, srcref, cg.reftype.Value, false, (dest_get, item_get) => {
							const {key, val} = two_tuple_to_prop(cg, cg.newLocal(new BinValue(cg, item_get).cast(cg.reftype.Tuple)));
							return cg.module.call('Dict.set', [dest_get, key, val], binaryen.none);
						});
					}
					// Dict.<T>((a= t, b= t, c= t));
					case this.source.type instanceof TYPE.Record: {
						const srcref: Local = cg.newLocal(new BinValue(cg, code_src).cast(cg.reftype.Record));
						return copy_array(
							cg.module,
							destdict,
							cg.structGet.dict.internal(destdict.get()),
							srcref,
							'Dict.adjust-capacity',
							cg.module.call('capacity-needed', [cg.module.array.len(srcref.get())], binaryen.i32),
						);
					}
					// Dict.<T>(List.<(sym, T)>(( (@a, t), (@b, t), (@c, t) )));
					// Dict.<T>([ (@a, t), (@b, t), (@c, t) ]);
					case this.source.type instanceof TYPE.List: {
						const srcref: Local = cg.newLocal(cg.structGet.list.internal(new BinValue(cg, code_src).cast(cg.reftype.List)), cg.reftype.ListInternal);
						return each_item(cg, destdict, srcref, cg.reftypeNull.Value, true, (dest_get, item_get) => {
							const {key, val} = two_tuple_to_prop(cg, cg.newLocal(new BinValue(cg, item_get).cast(cg.reftype.Tuple)));
							return cg.module.call('Dict.set', [dest_get, key, val], binaryen.none);
						});
					}
					// Dict.<T>(Dict.<T>( (a= t, b= t, c= t) ));
					// Dict.<T>([a= t, b= t, c= t]);
					case this.source.type instanceof TYPE.Dict: {
						const srcref: Local = cg.newLocal(cg.structGet.dict.internal(new BinValue(cg, code_src).cast(cg.reftype.Dict)), cg.reftype.DictInternal);
						return copy_array(
							cg.module,
							destdict,
							cg.structGet.dict.internal(destdict.get()),
							srcref,
							'Dict.adjust-capacity',
							cg.module.array.len(srcref.get()),
						);
					}
					// Dict.<T>(Set.<(sym, T)>(( (@a, t), (@b, t), (@c, t) )));
					// Dict.<T>({ (@a, t), (@b, t), (@c, t) });
					case this.source.type instanceof TYPE.Set: {
						const srcref: Local = cg.newLocal(cg.structGet.map.internal(new BinValue(cg, code_src).cast(cg.reftype.Map)), cg.reftype.MapInternal);
						return each_item(cg, destdict, srcref, cg.reftypeNull.Case, true, (dest_get, item_get) => {
							const {key, val} = two_tuple_to_prop(cg, cg.newLocal(new BinValue(cg, cg.structGet.case.ant(item_get)).cast(cg.reftype.Tuple)));
							return cg.module.call('Dict.set', [dest_get, key, val], binaryen.none);
						});
					}
					// Dict.<T>(Map.<sym, T>(( (@a, t), (@b, t), (@c, t) )));
					// Dict.<T>({@a -> t, @b -> t, @c -> t});
					case this.source.type instanceof TYPE.Map: {
						const srcref: Local = cg.newLocal(cg.structGet.map.internal(new BinValue(cg, code_src).cast(cg.reftype.Map)), cg.reftype.MapInternal);
						return each_item(cg, destdict, srcref, cg.reftypeNull.Case, true, (dest_get, item_get) => {
							const {key, val} = case_to_prop(cg, item_get);
							return cg.module.call('Dict.set', [dest_get, key, val], binaryen.none);
						});
					}
					default: {
						return assert.fail(`Expected \`${ this.source }\` to pass validation.`);
					}
				}
			}
			case TypeName.SET: {
				const destset: Local = cg.newLocal(new BinValue(cg, code_dest).cast(cg.reftype.Map));
				switch (true) { // using `ast_type_name()` is too expensive
					// Set.<T>((t, t, t));
					case this.source.type instanceof TYPE.Tuple: {
						const srcref: Local = cg.newLocal(new BinValue(cg, code_src).cast(cg.reftype.Tuple));
						return each_item(cg, destset, srcref, cg.reftype.Value, false, (dest_get, item_get) => cg.module.call('Map.set', [
							dest_get,
							item_get,
							cg.getConst(BinConst.NULL),
						], binaryen.none));
					}
					// Set.<T>(List.<T>((t, t, t)));
					// Set.<T>([t, t, t]);
					case this.source.type instanceof TYPE.List: {
						const srcref: Local = cg.newLocal(cg.structGet.list.internal(new BinValue(cg, code_src).cast(cg.reftype.List)), cg.reftype.ListInternal);
						return each_item(cg, destset, srcref, cg.reftypeNull.Value, true, (dest_get, item_get) => cg.module.call('Map.set', [
							dest_get,
							cg.module.ref.as_non_null(item_get),
							cg.getConst(BinConst.NULL),
						], binaryen.none));
					}
					// Set.<T>(Set.<T>((t, t, t)));
					// Set.<T>({t, t, t});
					case this.source.type instanceof TYPE.Set: {
						const srcref: Local = cg.newLocal(cg.structGet.map.internal(new BinValue(cg, code_src).cast(cg.reftype.Map)), cg.reftype.MapInternal);
						return copy_array(
							cg.module,
							destset,
							cg.structGet.map.internal(destset.get()),
							srcref,
							'Map.adjust-capacity',
							cg.module.array.len(srcref.get()),
						);
					}
					default: {
						return assert.fail(`Expected \`${ this.source }\` to pass validation.`);
					}
				}
			}
			case TypeName.MAP: {
				const destmap: Local = cg.newLocal(new BinValue(cg, code_dest).cast(cg.reftype.Map));
				switch (true) { // using `ast_type_name()` is too expensive
					// Map.<K, V>(( (k, v), (k, v), (k, v) ));
					case this.source.type instanceof TYPE.Tuple: {
						const srcref: Local = cg.newLocal(new BinValue(cg, code_src).cast(cg.reftype.Tuple));
						return each_item(cg, destmap, srcref, cg.reftype.Value, false, (dest_get, item_get) => {
							const {ant, con} = two_tuple_to_case(cg, cg.newLocal(new BinValue(cg, item_get).cast(cg.reftype.Tuple)));
							return cg.module.call('Map.set', [dest_get, ant, con], binaryen.none);
						});
					}
					// Map.<K, V>(List.<(K, V)>(( (k, v), (k, v), (k, v) )));
					// Map.<K, V>([ (k, v), (k, v), (k, v) ]);
					case this.source.type instanceof TYPE.List: {
						const srcref: Local = cg.newLocal(cg.structGet.list.internal(new BinValue(cg, code_src).cast(cg.reftype.List)), cg.reftype.ListInternal);
						return each_item(cg, destmap, srcref, cg.reftypeNull.Value, true, (dest_get, item_get) => {
							const {ant, con} = two_tuple_to_case(cg, cg.newLocal(new BinValue(cg, item_get).cast(cg.reftype.Tuple)));
							return cg.module.call('Map.set', [dest_get, ant, con], binaryen.none);
						});
					}
					// Map.<K, V>(Set.<(K, V)>(( (k, v), (k, v), (k, v) )));
					// Map.<K, V>({ (k, v), (k, v), (k, v) });
					case this.source.type instanceof TYPE.Set: {
						const srcref: Local = cg.newLocal(cg.structGet.map.internal(new BinValue(cg, code_src).cast(cg.reftype.Map)), cg.reftype.MapInternal);
						return each_item(cg, destmap, srcref, cg.reftypeNull.Case, true, (dest_get, item_get) => {
							const {ant, con} = two_tuple_to_case(cg, cg.newLocal(new BinValue(cg, cg.structGet.case.ant(item_get)).cast(cg.reftype.Tuple)));
							return cg.module.call('Map.set', [dest_get, ant, con], binaryen.none);
						});
					}
					// Map.<K, V>(Map.<K, V>(( (k, v), (k, v), (k, v) )));
					// Map.<K, V>({k -> v, k -> v, k -> v});
					case this.source.type instanceof TYPE.Map: {
						const srcref: Local = cg.newLocal(cg.structGet.map.internal(new BinValue(cg, code_src).cast(cg.reftype.Map)), cg.reftype.MapInternal);
						return copy_array(
							cg.module,
							destmap,
							cg.structGet.map.internal(destmap.get()),
							srcref,
							'Map.adjust-capacity',
							cg.module.array.len(srcref.get()),
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
