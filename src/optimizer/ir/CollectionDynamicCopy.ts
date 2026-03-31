import * as assert from 'node:assert';
import binaryen from 'binaryen';
import * as xjs from 'extrajs';
import {
	STRUCT_FIELD,
	BinValue,
	type Builder,
	type Local,
} from '../../index.ts';
import {
	assert_instanceof,
	memoizeMethod,
	runOnceMethod,
} from '../../lib/index.ts';
import {
	TYPE,
	VALUE,
} from '../../typer/index.ts';
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
	when_item_is_non_null: (item: Local) => binaryen.ExpressionRef | binaryen.ExpressionRef[], // FIXME: always use singular
): binaryen.ExpressionRef {
	// HACK: Temporary counter until we get CodeGenerator blocks.
	if (!('blockCount' in cg)) {
		Reflect.defineProperty(cg, 'blockCount', {enumerable: true, writable: true, value: 0n});
	}
	const block_n: bigint = Reflect.get(cg, 'blockCount') as bigint;
	Reflect.set(cg, 'blockCount', block_n + 1n);

	const i:    Local = cg.newLocal(cg.module.i32.const(0));
	const item: Local = cg.newLocal(cg.module.array.get(srcref.get(), i.get(), itemtype));

	const non_null_item: binaryen.ExpressionRef | binaryen.ExpressionRef[] = when_item_is_non_null(item); // FIXME: always use singular

	return cg.module.block(null, [
		destobj.set(),
		srcref.set(),
		cg.module.block(`exit-${ block_n }`, [
			i.set(),
			cg.module.loop(`repeat-${ block_n }`, cg.module.block(null, [
				cg.module.br_if(`exit-${ block_n }`, cg.module.i32.ge_u(i.get(), cg.module.array.len(srcref.get()))),
				item.set(),
				...(check_null // FIXME: always use singular
					? [cg.module.if(
						cg.module.i32.eqz(cg.module.ref.is_null(item.get())),
						Array.isArray(non_null_item) ? cg.module.block(null, non_null_item) : non_null_item,
					)]
					: Array.isArray(non_null_item) ? non_null_item : [non_null_item]
				),
				i.inc(),
				cg.module.br(`repeat-${ block_n }`),
			])),
		]),
	]);
}



/**
 * Converts an array of key–value pairs into an array of properties for Dict insertion.
 * The pairs given must be an array of possibly nullable `$Value`s,
 * where each `$Value` holds a composite `$Tuple`, which has two `$Values`:
 * one representing a Counterpoint value of type `sym`, followed by one representing any Counterpoint value.
 * This method maps each pair to a `$Property` by using the symbol ID as the key, and inserts it (via `$Dict.set`) into the given Dict.
 *
 * Example using `$ListInternal` (though a `$Tuple` could also be given):
 * ```
 * ;; argument:
 * (array.new_fixed $ListInternal 4
 * 	(struct.new $Value (i32.const 1) (v128.const i64x2 0 0) (array.new_fixed $Tuple 2
 * 		(struct.new $Value (i32.const 0) (v128.const i16x8 0 0 0 0x0028 <sym>) (rev.null eq)) ;; CPL type `sym`
 * 		(struct.new $Value (i32.const 1) (v128.const i64x2 0 0) <val>) ;; any CPL value, primitive or composite
 * 	))
 * 	(struct.new $Value (i32.const 1) (v128.const i64x2 0 0) (array.new_fixed $Tuple 2
 * 		(struct.new $Value (i32.const 0) (v128.const i16x8 0 0 0 0x0028 <sym>) (rev.null eq)) ;; CPL type `sym`
 * 		(struct.new $Value (i32.const 1) (v128.const i64x2 0 0) <val>) ;; any CPL value, primitive or composite
 * 	))
 * 	(struct.new $Value (i32.const 1) (v128.const i64x2 0 0) (array.new_fixed $Tuple 2
 * 		(struct.new $Value (i32.const 0) (v128.const i16x8 0 0 0 0x0028 <sym>) (rev.null eq)) ;; CPL type `sym`
 * 		(struct.new $Value (i32.const 1) (v128.const i64x2 0 0) <val>) ;; any CPL value, primitive or composite
 * 	))
 * 	(ref.null $Value)
 * )
 * ;; map:
 * (array.new_fixed $DictInternal 4
 * 	(struct.new $Property
 * 		(i64.const <sym_key>)
 * 		(struct.new $Value (i32.const 1) (v128.const i64x2 0 0) <val>)
 * 	)
 * 	(struct.new $Property
 * 		(i64.const <sym_key>)
 * 		(struct.new $Value (i32.const 1) (v128.const i64x2 0 0) <val>)
 * 	)
 * 	(struct.new $Property
 * 		(i64.const <sym_key>)
 * 		(struct.new $Value (i32.const 1) (v128.const i64x2 0 0) <val>)
 * 	)
 * 	(ref.null $Property)
 * )
 * ```
 *
 * @param cg         code-generator
 * @param dict       a Local holding the dict, a `(ref $Dict)`, into which to insert the properties
 * @param pairs      a Local holding the list of 2-tuples, an `(array (ref null? $Tuple))`
 * @param check_null whether to test whether each item in `pairs` is null (`false` if the array is a `$Tuple`, `true` if it’s a `$ListInternal`)
 * @return           a block performing the work, returning void
 */



/**
 * Converts an array of items into an array of elements for Set insertion.
 * The pairs given must be an array of possibly nullable `$Value`s,
 * where each `$Value` represents any Counterpoint value.
 * This method uses each item as an antecedent, and inserts it (via `$Map.set`), along with Counterpoint `null` as the consequent, into the given Set.
 *
 * Example using `$ListInternal` (though a `$Tuple` could also be given):
 * ```
 * ;; argument:
 * (array.new_fixed $ListInternal 4
 * 	(struct.new $Value <ant>) ;; any CPL value, primitive or composite
 * 	(struct.new $Value <ant>) ;; any CPL value, primitive or composite
 * 	(struct.new $Value <ant>) ;; any CPL value, primitive or composite
 * 	(ref.null $Value)
 * )
 * ;; map:
 * (array.new_fixed $MapInternal 4
 * 	(struct.new $Case
 * 		(struct.new $Value <ant>)
 * 		(struct.new $Value (i32.const 0) (v128.const i16x8 0 0 0 0x0001 0 0 0 0) (ref.null eq)) ;; CPL `null` value
 * 	)
 * 	(struct.new $Case
 * 		(struct.new $Value <ant>)
 * 		(struct.new $Value (i32.const 0) (v128.const i16x8 0 0 0 0x0001 0 0 0 0) (ref.null eq)) ;; CPL `null` value
 * 	)
 * 	(struct.new $Case
 * 		(struct.new $Value <ant>)
 * 		(struct.new $Value (i32.const 0) (v128.const i16x8 0 0 0 0x0001 0 0 0 0) (ref.null eq)) ;; CPL `null` value
 * 	)
 * 	(ref.null $Case)
 * )
 * ```
 *
 * @param cg         code-generator
 * @param set        a Local holding the Set, a `(ref $Map)`, into which to insert the elements
 * @param items      a Local holding the list of items, an `(array (ref null? $Value))`
 * @param check_null whether to test whether each item in `items` is null (`false` if the array is a `$Tuple`, `true` if it’s a `$ListInternal`)
 * @return           a block performing the work, returning void
 */



/**
 * Converts an array of key–value pairs into an array of Cases for Map insertion.
 * The pairs given must be an array of possibly nullable `$Value`s,
 * where each `$Value` holds a composite `$Tuple`, which has two `$Values`:
 * each representing a Counterpoint value of any type.
 * This method maps each pair to a `$Case` by using a hash of the first inner Value as the antecedent,
 * and the second inner Value as the consequent, and inserts it (via `$Map.set`) into the given Map.
 *
 * Example using `$ListInternal` (though a `$Tuple` could also be given):
 * ```
 * ;; argument:
 * (array.new_fixed $ListInternal 4
 * 	(struct.new $Value (i32.const 1) (v128.const i64x2 0 0) (array.new_fixed $Tuple 2
 * 		(struct.new $Value <ant>) ;; any CPL value, primitive or composite
 * 		(struct.new $Value <con>) ;; any CPL value, primitive or composite
 * 	))
 * 	(struct.new $Value (i32.const 1) (v128.const i64x2 0 0) (array.new_fixed $Tuple 2
 * 		(struct.new $Value <ant>) ;; any CPL value, primitive or composite
 * 		(struct.new $Value <con>) ;; any CPL value, primitive or composite
 * 	))
 * 	(struct.new $Value (i32.const 1) (v128.const i64x2 0 0) (array.new_fixed $Tuple 2
 * 		(struct.new $Value <ant>) ;; any CPL value, primitive or composite
 * 		(struct.new $Value <con>) ;; any CPL value, primitive or composite
 * 	))
 * 	(ref.null $Value)
 * )
 * ;; map:
 * (array.new_fixed $MapInternal 4
 * 	(struct.new $Case
 * 		(struct.new $Value <ant>)
 * 		(struct.new $Value <con>)
 * 	)
 * 	(struct.new $Case
 * 		(struct.new $Value <ant>)
 * 		(struct.new $Value <con>)
 * 	)
 * 	(struct.new $Case
 * 		(struct.new $Value <ant>)
 * 		(struct.new $Value <con>)
 * 	)
 * 	(ref.null $Case)
 * )
 * ```
 *
 * @param cg         code-generator
 * @param map        a Local holding the Map, a `(ref $Map)`, into which to insert the Cases
 * @param pairs      a Local holding the list of 2-tuples, an `(array (ref null? $Tuple))`
 * @param check_null whether to test whether each item in `pairs` is null (`false` if the array is a `$Tuple`, `true` if it’s a `$ListInternal`)
 * @return           a block performing the work, returning void
 */



/** Copy an existing collection into a dynamic collection (List/Dict/Set/Map). */
export class CollectionDynamicCopy extends Opcode implements Instruction {
	public constructor(
		private readonly name:        CollectionDynamicName,
		private readonly destination: Value,
		private readonly source:      Value,
	) {
		super(new Map<TypeName, OpCode>([
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
		const rt_value:  binaryen.Type          = cg.getReftype('(ref $Value)');
		const code_dest: binaryen.ExpressionRef = this.destination.codegen(cg);
		const code_src:  binaryen.ExpressionRef = this.source     .codegen(cg);

		switch (this.name) {
			case TypeName.LIST: {
				const destlist: Local = cg.newLocal(new BinValue(cg, code_dest).cast('(ref $List)'));
				switch (true) { // using `ast_type_name()` is too expensive
					// List.<T>((t, t, t));
					case this.source.type instanceof TYPE.Tuple: {
						const srcref: Local = cg.newLocal(new BinValue(cg, code_src).cast('(ref $Tuple)'));
						return copy_array(
							cg.module,
							destlist,
							cg.getListInternal(destlist.get()),
							srcref,
							'List.adjust-capacity',
							cg.module.call('capacity-needed', [cg.module.array.len(srcref.get())], binaryen.i32),
						);
					}
					// List.<T>(List.<T>((t, t, t)));
					// List.<T>([t, t, t]);
					case this.source.type instanceof TYPE.List: {
						const srcref: Local = cg.newLocal(cg.getListInternal(new BinValue(cg, code_src).cast('(ref $List)')));
						return copy_array(
							cg.module,
							destlist,
							cg.getListInternal(destlist.get()),
							srcref,
							'List.adjust-capacity',
							cg.module.array.len(srcref.get()),
						);
					}
					// List.<T>(Set.<T>((t, t, t)));
					// List.<T>({t, t, t});
					case this.source.type instanceof TYPE.Set: {
						const srcref: Local = cg.newLocal(cg.getMapInternal(new BinValue(cg, code_src).cast('(ref $Map)')));
						/*
						 * Converts a Set of Values into an array of Values for List insertion.
						 * The given Set is an underlying Map with an array of cases: possibly nullable `$Case`s,
						 * where each `$Case` has a `$Value` antecedent and a Counterpoint `null` consequent,
						 * where the antecedent represents a Counterpoint value of any type.
						 * This method extracts from each `$Case` the `$Value` antecedent,
						 * and inserts it (via `$List.set`) into the given List.
						 *
						 * NOTE: This method iterates over the Set in internal array order, and inserts them into the List in that order.
						 * The items in the resulting List do not necessarily appear in the same order as they were inserted into the Set.
						 *
						 * Example using `$MapInternal`:
						 * ```
						 * ;; argument:
						 * (array.new_fixed $MapInternal 4
						 * 	(struct.new $Case
						 * 		(struct.new $Value <ant>) ;; any CPL value, primitive or composite
						 * 		(struct.new $Value <CPL null>)
						 * 	)
						 * 	(struct.new $Case
						 * 		(struct.new $Value <ant>) ;; any CPL value, primitive or composite
						 * 		(struct.new $Value <CPL null>)
						 * 	)
						 * 	(struct.new $Case
						 * 		(struct.new $Value <ant>) ;; any CPL value, primitive or composite
						 * 		(struct.new $Value <CPL null>)
						 * 	)
						 * 	(ref.null $Case)
						 * )
						 * ;; map:
						 * (array.new_fixed $ListInternal 4
						 * 	(struct.new $Value <ant>)
						 * 	(struct.new $Value <ant>)
						 * 	(struct.new $Value <ant>)
						 * 	(ref.null $Value)
						 * )
						 * ```
						 */
						const j: Local = cg.newLocal(cg.module.i32.const(0));
						return cg.module.block(null, [
							j.set(),
							each_item(cg, destlist, srcref, cg.getReftype('(ref null $Case)'), true, (item) => cg.module.block(null, [
								cg.module.call('List.set', [
									destlist.get(),
									j.get(),
									cg.module.struct.get(STRUCT_FIELD.CASE_ANT, item.get(), rt_value),
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
				const destdict: Local = cg.newLocal(new BinValue(cg, code_dest).cast('(ref $Dict)'));
				switch (true) { // using `ast_type_name()` is too expensive
					// Dict.<T>(( (@a, t), (@b, t), (@c, t) ));
					case this.source.type instanceof TYPE.Tuple: {
						const srcref: Local = cg.newLocal(new BinValue(cg, code_src).cast('(ref $Tuple)'));
						return each_item(cg, destdict, srcref, cg.getReftype('(ref $Value)'), false, (item) => {
							const pair: Local = cg.newLocal(new BinValue(cg, item.get()).cast('(ref $Tuple)'));
							return [
								pair.set(),
								cg.module.call('Dict.set', [
									destdict.get(),
									cg.module.i64.extend_u(new BinValue(cg, cg.module.array.get(pair.get(), cg.module.i32.const(0), rt_value)).interpret('intValue')), // TODO: v0.5: intValue will already be i64; remove `cg.module.i64.extend_u()` call
									cg.module.array.get(pair.get(), cg.module.i32.const(1), rt_value),
								], binaryen.none),
							];
						});
					}
					// Dict.<T>((a= t, b= t, c= t));
					case this.source.type instanceof TYPE.Record: {
						const srcref: Local = cg.newLocal(new BinValue(cg, code_src).cast('(ref $Record)'));
						return copy_array(
							cg.module,
							destdict,
							cg.getDictInternal(destdict.get()),
							srcref,
							'Dict.adjust-capacity',
							cg.module.call('capacity-needed', [cg.module.array.len(srcref.get())], binaryen.i32),
						);
					}
					// Dict.<T>(List.<(sym, T)>(( (@a, t), (@b, t), (@c, t) )));
					// Dict.<T>([ (@a, t), (@b, t), (@c, t) ]);
					case this.source.type instanceof TYPE.List: {
						const srcref: Local = cg.newLocal(cg.getListInternal(new BinValue(cg, code_src).cast('(ref $List)')));
						return each_item(cg, destdict, srcref, cg.getReftype('(ref null $Value)'), true, (item) => {
							const pair: Local = cg.newLocal(new BinValue(cg, item.get()).cast('(ref $Tuple)'));
							return [
								pair.set(),
								cg.module.call('Dict.set', [
									destdict.get(),
									cg.module.i64.extend_u(new BinValue(cg, cg.module.array.get(pair.get(), cg.module.i32.const(0), rt_value)).interpret('intValue')), // TODO: v0.5: intValue will already be i64; remove `cg.module.i64.extend_u()` call
									cg.module.array.get(pair.get(), cg.module.i32.const(1), rt_value),
								], binaryen.none),
							];
						});
					}
					// Dict.<T>(Dict.<T>( (a= t, b= t, c= t) ));
					// Dict.<T>([a= t, b= t, c= t]);
					case this.source.type instanceof TYPE.Dict: {
						const srcref: Local = cg.newLocal(cg.getDictInternal(new BinValue(cg, code_src).cast('(ref $Dict)')));
						return copy_array(
							cg.module,
							destdict,
							cg.getDictInternal(destdict.get()),
							srcref,
							'Dict.adjust-capacity',
							cg.module.array.len(srcref.get()),
						);
					}
					// Dict.<T>(Set.<(sym, T)>(( (@a, t), (@b, t), (@c, t) )));
					// Dict.<T>({ (@a, t), (@b, t), (@c, t) });
					case this.source.type instanceof TYPE.Set: {
						const srcref: Local = cg.newLocal(cg.getMapInternal(new BinValue(cg, code_src).cast('(ref $Map)')));
						/*
						 * Converts a Set of key–value pairs into an array of Properties for Dict insertion.
						 * The given Set is an underlying Map with an array of cases: possibly nullable `$Case`s,
						 * where each `$Case` has a `$Value` antecedent and a Counterpoint `null` consequent,
						 * where the antecedent is a composite `$Tuple` with two `$Value`s:
						 * one representing a Counterpoint value of type `sym`, followed by one representing any Counterpoint value.
						 * This method maps each `$Case` of the form `$Case ($Value ($Tuple (sym, val)), null)` to a `$Property`,
						 * and inserts it (via `$Dict.set`) into the given Dict.
						 *
						 * Example using `$MapInternal`:
						 * ```
						 * ;; argument:
						 * (array.new_fixed $MapInternal 4
						 * 	(struct.new $Case
						 * 		(struct.new $Value (i32.const 1) (v128.const i64x2 0 0) (array.new_fixed $Tuple 2
						 * 			(struct.new $Value (i32.const 0) (v128.const i16x8 0 0 0 0x0028 <sym>) (rev.null eq)) ;; CPL type `sym`
						 * 			(struct.new $Value <val>) ;; any CPL value, primitive or composite
						 * 		))
						 * 		(struct.new $Value <CPL null>)
						 * 	)
						 * 	(struct.new $Case
						 * 		(struct.new $Value (i32.const 1) (v128.const i64x2 0 0) (array.new_fixed $Tuple 2
						 * 			(struct.new $Value (i32.const 0) (v128.const i16x8 0 0 0 0x0028 <sym>) (rev.null eq)) ;; CPL type `sym`
						 * 			(struct.new $Value <val>) ;; any CPL value, primitive or composite
						 * 		))
						 * 		(struct.new $Value <CPL null>)
						 * 	)
						 * 	(struct.new $Case
						 * 		(struct.new $Value (i32.const 1) (v128.const i64x2 0 0) (array.new_fixed $Tuple 2
						 * 			(struct.new $Value (i32.const 0) (v128.const i16x8 0 0 0 0x0028 <sym>) (rev.null eq)) ;; CPL type `sym`
						 * 			(struct.new $Value <val>) ;; any CPL value, primitive or composite
						 * 		))
						 * 		(struct.new $Value <CPL null>)
						 * 	)
						 * 	(ref.null $Case)
						 * )
						 * ;; map:
						 * (array.new_fixed $DictInternal 4
						 * 	(struct.new $Property
						 * 		(i64.const <sym_key>)
						 * 		(struct.new $Value <val>)
						 * 	)
						 * 	(struct.new $Property
						 * 		(i64.const <sym_key>)
						 * 		(struct.new $Value <val>)
						 * 	)
						 * 	(struct.new $Property
						 * 		(i64.const <sym_key>)
						 * 		(struct.new $Value <val>)
						 * 	)
						 * 	(ref.null $Property)
						 * )
						 * ```
						 */
						return each_item(cg, destdict, srcref, cg.getReftype('(ref null $Case)'), true, (item) => {
							const pair: Local = cg.newLocal(new BinValue(cg, cg.module.struct.get(STRUCT_FIELD.CASE_ANT, item.get(), rt_value)).cast('(ref $Tuple)'));
							return cg.module.block(null, [
								pair.set(),
								cg.module.call('Dict.set', [
									destdict.get(),
									cg.module.i64.extend_u(new BinValue(cg, cg.module.array.get(pair.get(), cg.module.i32.const(0), rt_value)).interpret('intValue')), // TODO: v0.5: intValue will already be i64; remove `cg.module.i64.extend_u()` call
									cg.module.array.get(pair.get(), cg.module.i32.const(1), rt_value),
								], binaryen.none),
							]);
						});
					}
					// Dict.<T>(Map.<sym, T>(( (@a, t), (@b, t), (@c, t) )));
					// Dict.<T>({@a -> t, @b -> t, @c -> t});
					case this.source.type instanceof TYPE.Map: {
						const srcref: Local = cg.newLocal(cg.getMapInternal(new BinValue(cg, code_src).cast('(ref $Map)')));
						/*
						 * Converts a Map into an array of Properties for Dict insertion.
						 * The given Map has an array of cases: possibly nullable `$Case`s,
						 * where each `$Case`’s antecedent represents a Counterpoint value of type `sym`,
						 * and consequent represents any Counterpoint value
						 * This method maps each `$Case` to a `$Property`,
						 * and inserts it (via `$Dict.set`) into the given Dict.
						 *
						 * Example using `$MapInternal`:
						 * ```
						 * ;; argument:
						 * (array.new_fixed $MapInternal 4
						 * 	(struct.new $Case
						 * 		(struct.new $Value (i32.const 0) (v128.const i16x8 0 0 0 0x0028 <sym>) (rev.null eq)) ;; CPL type `sym`
						 * 		(struct.new $Value <val>) ;; any CPL value, primitive or composite
						 * 	)
						 * 	(struct.new $Case
						 * 		(struct.new $Value (i32.const 0) (v128.const i16x8 0 0 0 0x0028 <sym>) (rev.null eq)) ;; CPL type `sym`
						 * 		(struct.new $Value <val>) ;; any CPL value, primitive or composite
						 * 	)
						 * 	(struct.new $Case
						 * 		(struct.new $Value (i32.const 0) (v128.const i16x8 0 0 0 0x0028 <sym>) (rev.null eq)) ;; CPL type `sym`
						 * 		(struct.new $Value <val>) ;; any CPL value, primitive or composite
						 * 	)
						 * 	(ref.null $Case)
						 * )
						 * ;; map:
						 * (array.new_fixed $DictInternal 4
						 * 	(struct.new $Property
						 * 		(i64.const <sym_key>)
						 * 		(struct.new $Value <val>)
						 * 	)
						 * 	(struct.new $Property
						 * 		(i64.const <sym_key>)
						 * 		(struct.new $Value <val>)
						 * 	)
						 * 	(struct.new $Property
						 * 		(i64.const <sym_key>)
						 * 		(struct.new $Value <val>)
						 * 	)
						 * 	(ref.null $Property)
						 * )
						 * ```
						 */
						return each_item(cg, destdict, srcref, cg.getReftype('(ref null $Case)'), true, (item) => cg.module.call('Dict.set', [
							destdict.get(),
							cg.module.i64.extend_u(new BinValue(cg, cg.module.struct.get(STRUCT_FIELD.CASE_ANT, item.get(), rt_value)).interpret('intValue')), // TODO: v0.5: intValue will already be i64; remove `cg.module.i64.extend_u()` call
							cg.module.struct.get(STRUCT_FIELD.CASE_CON, item.get(), rt_value),
						], binaryen.none));
					}
					default: {
						return assert.fail(`Expected \`${ this.source }\` to pass validation.`);
					}
				}
			}
			case TypeName.SET: {
				const destset: Local = cg.newLocal(new BinValue(cg, code_dest).cast('(ref $Map)'));
				switch (true) { // using `ast_type_name()` is too expensive
					// Set.<T>((t, t, t));
					case this.source.type instanceof TYPE.Tuple: {
						const srcref: Local = cg.newLocal(new BinValue(cg, code_src).cast('(ref $Tuple)'));
						return each_item(cg, destset, srcref, cg.getReftype('(ref $Value)'), false, (item) => cg.module.call('Map.set', [
							destset.get(),
							item.get(),
							new BinValue(cg, VALUE.NULL.codegen(cg.module)).value,
						], binaryen.none));
					}
					// Set.<T>(List.<T>((t, t, t)));
					// Set.<T>([t, t, t]);
					case this.source.type instanceof TYPE.List: {
						const srcref: Local = cg.newLocal(cg.getListInternal(new BinValue(cg, code_src).cast('(ref $List)')));
						return each_item(cg, destset, srcref, cg.getReftype('(ref null $Value)'), true, (item) => cg.module.call('Map.set', [
							destset.get(),
							item.get(),
							new BinValue(cg, VALUE.NULL.codegen(cg.module)).value,
						], binaryen.none));
					}
					// Set.<T>(Set.<T>((t, t, t)));
					// Set.<T>({t, t, t});
					case this.source.type instanceof TYPE.Set: {
						const srcref: Local = cg.newLocal(cg.getMapInternal(new BinValue(cg, code_src).cast('(ref $Map)')));
						return copy_array(
							cg.module,
							destset,
							cg.getMapInternal(destset.get()),
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
				const destmap: Local = cg.newLocal(new BinValue(cg, code_dest).cast('(ref $Map)'));
				switch (true) { // using `ast_type_name()` is too expensive
					// Map.<K, V>(( (k, v), (k, v), (k, v) ));
					case this.source.type instanceof TYPE.Tuple: {
						const srcref: Local = cg.newLocal(new BinValue(cg, code_src).cast('(ref $Tuple)'));
						return each_item(cg, destmap, srcref, cg.getReftype('(ref $Value)'), false, (item) => {
							const pair: Local = cg.newLocal(new BinValue(cg, item.get()).cast('(ref $Tuple)'));
							return [
								pair.set(),
								cg.module.call('Map.set', [
									destmap.get(),
									cg.module.array.get(pair.get(), cg.module.i32.const(0), rt_value),
									cg.module.array.get(pair.get(), cg.module.i32.const(1), rt_value),
								], binaryen.none),
							];
						});
					}
					// Map.<K, V>(List.<(K, V)>(( (k, v), (k, v), (k, v) )));
					// Map.<K, V>([ (k, v), (k, v), (k, v) ]);
					case this.source.type instanceof TYPE.List: {
						const srcref: Local = cg.newLocal(cg.getListInternal(new BinValue(cg, code_src).cast('(ref $List)')));
						return each_item(cg, destmap, srcref, cg.getReftype('(ref null $Value)'), true, (item) => {
							const pair: Local = cg.newLocal(new BinValue(cg, item.get()).cast('(ref $Tuple)'));
							return [
								pair.set(),
								cg.module.call('Map.set', [
									destmap.get(),
									cg.module.array.get(pair.get(), cg.module.i32.const(0), rt_value),
									cg.module.array.get(pair.get(), cg.module.i32.const(1), rt_value),
								], binaryen.none),
							];
						});
					}
					// Map.<K, V>(Set.<(K, V)>(( (k, v), (k, v), (k, v) )));
					// Map.<K, V>({ (k, v), (k, v), (k, v) });
					case this.source.type instanceof TYPE.Set: {
						const srcref: Local = cg.newLocal(cg.getMapInternal(new BinValue(cg, code_src).cast('(ref $Map)')));
						/*
						 * Converts a Set of key–value pairs into an array of Cases for Map insertion.
						 * The given Set is an underlying Map with an array of cases: possibly nullable `$Case`s,
						 * where each `$Case` has a `$Value` antecedent and a Counterpoint `null` consequent,
						 * where the antecedent is a composite `$Tuple` with two `$Values`: each representing a Counterpoint value of any type.
						 * This method maps each `$Case` of the form `$Case ($Value ($Tuple (ant, con)), null)` to a `$Case` of the form `$Case (ant, con)`,
						 * and inserts it (via `$Map.set`) into the given Map.
						 *
						 * Example using `$MapInternal`:
						 * ```
						 * ;; argument:
						 * (array.new_fixed $MapInternal 4
						 * 	(struct.new $Case
						 * 		(struct.new $Value (i32.const 1) (v128.const i64x2 0 0) (array.new_fixed $Tuple 2
						 * 			(struct.new $Value <ant>) ;; any CPL value, primitive or composite
						 * 			(struct.new $Value <con>) ;; any CPL value, primitive or composite
						 * 		))
						 * 		(struct.new $Value <CPL null>)
						 * 	)
						 * 	(struct.new $Case
						 * 		(struct.new $Value (i32.const 1) (v128.const i64x2 0 0) (array.new_fixed $Tuple 2
						 * 			(struct.new $Value <ant>) ;; any CPL value, primitive or composite
						 * 			(struct.new $Value <con>) ;; any CPL value, primitive or composite
						 * 		))
						 * 		(struct.new $Value <CPL null>)
						 * 	)
						 * 	(struct.new $Case
						 * 		(struct.new $Value (i32.const 1) (v128.const i64x2 0 0) (array.new_fixed $Tuple 2
						 * 			(struct.new $Value <ant>) ;; any CPL value, primitive or composite
						 * 			(struct.new $Value <con>) ;; any CPL value, primitive or composite
						 * 		))
						 * 		(struct.new $Value <CPL null>)
						 * 	)
						 * 	(ref.null $Case)
						 * )
						 * ;; map:
						 * (array.new_fixed $MapInternal 4
						 * 	(struct.new $Case
						 * 		(struct.new $Value <ant>)
						 * 		(struct.new $Value <con>)
						 * 	)
						 * 	(struct.new $Case
						 * 		(struct.new $Value <ant>)
						 * 		(struct.new $Value <con>)
						 * 	)
						 * 	(struct.new $Case
						 * 		(struct.new $Value <ant>)
						 * 		(struct.new $Value <con>)
						 * 	)
						 * 	(ref.null $Case)
						 * )
						 * ```
						 */
						return each_item(cg, destmap, srcref, cg.getReftype('(ref null $Case)'), true, (item) => {
							const pair: Local = cg.newLocal(new BinValue(cg, cg.module.struct.get(STRUCT_FIELD.CASE_ANT, item.get(), rt_value)).cast('(ref $Tuple)'));
							return cg.module.block(null, [
								pair.set(),
								cg.module.call('Map.set', [
									destmap.get(),
									cg.module.array.get(pair.get(), cg.module.i32.const(0), rt_value),
									cg.module.array.get(pair.get(), cg.module.i32.const(1), rt_value),
								], binaryen.none),
							]);
						});
					}
					// Map.<K, V>(Map.<K, V>(( (k, v), (k, v), (k, v) )));
					// Map.<K, V>({k -> v, k -> v, k -> v});
					case this.source.type instanceof TYPE.Map: {
						const srcref: Local = cg.newLocal(cg.getMapInternal(new BinValue(cg, code_src).cast('(ref $Map)')));
						return copy_array(
							cg.module,
							destmap,
							cg.getMapInternal(destmap.get()),
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
