import * as assert from 'node:assert';
import binaryen from 'binaryen';
import * as xjs from 'extrajs';
import {
	BinValue,
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
function set_pairs_as_props(cg: Builder, dict: Local, pairs: Local, check_null: boolean): binaryen.ExpressionRef {
	const rt_value: binaryen.Type = cg.getReftype('(ref $Value)');
	const i:    Local = cg.newLocal(cg.module.i32.const(0));
	const item: Local = cg.newLocal(cg.module.array.get(pairs.get(), i.get(), cg.getReftype(check_null ? '(ref null $Value)' : '(ref $Value)')));
	const pair: Local = cg.newLocal(new BinValue(cg, item.get()).cast('(ref $Tuple)'));

	const item_is_non_null: binaryen.ExpressionRef[] = [
		pair.set(),
		cg.module.call('Dict.set', [
			dict.get(),
			cg.module.i64.extend_u(new BinValue(cg, cg.module.array.get(pair.get(), cg.module.i32.const(0), rt_value)).interpret('intValue')), // TODO: v0.5: intValue will already be i64; remove `cg.module.i64.extend_u()` call
			cg.module.array.get(pair.get(), cg.module.i32.const(1), rt_value),
		], binaryen.none),
	];

	// HACK: Temporary counter until we get CodeGenerator blocks.
	if (!('blockCount' in cg)) {
		Reflect.defineProperty(cg, 'blockCount', {enumerable: true, writable: true, value: 0n});
	}
	const block_n: bigint = Reflect.get(cg, 'blockCount') as bigint;
	Reflect.set(cg, 'blockCount', block_n + 1n);

	return cg.module.block(null, [
		dict.set(),
		pairs.set(),
		cg.module.block(`exit-${ block_n }`, [
			i.set(),
			cg.module.loop(`repeat-${ block_n }`, cg.module.block(null, [
				cg.module.br_if(`exit-${ block_n }`, cg.module.i32.ge_u(i.get(), cg.module.array.len(pairs.get()))),
				item.set(),
				...(check_null
					? [cg.module.if(
						cg.module.i32.eqz(cg.module.ref.is_null(item.get())),
						cg.module.block(null, item_is_non_null),
					)]
					: item_is_non_null
				),
				i.inc(),
				cg.module.br(`repeat-${ block_n }`),
			])),
		]),
	]);
}



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
		const code_dest: binaryen.ExpressionRef = this.destination.codegen(cg);
		const code_src:  binaryen.ExpressionRef = this.source     .codegen(cg);

		switch (this.name) {
			case TypeName.LIST: {
				const destlist: Local = cg.newLocal(new BinValue(cg, code_dest).cast('(ref $List)'));
				switch (true) { // using `ast_type_name()` is too expensive
					// List.<T>((t, t, t));
					case this.source.type instanceof TYPE.Tuple: {
						const srcref: Local = cg.newLocal(new BinValue(cg, code_src) .cast('(ref $Tuple)'));
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
						throw new Error('not yet supported.');
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
						return set_pairs_as_props(cg, destdict, cg.newLocal(new BinValue(cg, code_src).cast('(ref $Tuple)')), false);
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
						return set_pairs_as_props(cg, destdict, cg.newLocal(cg.getListInternal(new BinValue(cg, code_src).cast('(ref $List)'))), true);
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
						throw new Error('not yet supported.');
					}
					// Dict.<T>(Map.<sym, T>(( (@a, t), (@b, t), (@c, t) )));
					// Dict.<T>({@a -> t, @b -> t, @c -> t});
					case this.source.type instanceof TYPE.Map: {
						throw new Error('not yet supported.');
					}
					default: {
						return assert.fail(`Expected \`${ this.source }\` to pass validation.`);
					}
				}
			}
			case TypeName.SET:
			case TypeName.MAP: {
				throw new Error('not yet supported.');
			}
		}
	}
}
