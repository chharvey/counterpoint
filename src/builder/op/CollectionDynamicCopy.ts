import * as assert from 'node:assert';
import type * as binaryen from 'binaryen.ts';
import * as xjs from 'extrajs';
import type {CodeGenerator} from '../../index.ts';
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
						throw new TypeError(`Expected \`${src}\` to be of type \`Tuple | List | Set\`.`);
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
						throw new TypeError(`Expected \`${src}\` to be of type \`Tuple | Record | List | Dict | Set | Map\`.`);
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
						throw new TypeError(`Expected \`${src}\` to be of type \`Tuple | List | Set\`.`);
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
						throw new TypeError(`Expected \`${src}\` to be of type \`Tuple | List | Set | Map\`.`);
					}
				}
			}
		}
	}

	@memoizeMethod
	public override codegen(cg: CodeGenerator): binaryen.ExpressionRef {
		const {reftype, Value, List, Dict, Map: VmMap} = cg.vm;

		const code_dest: binaryen.ExpressionRef = this.destination.codegen(cg);
		const code_src:  binaryen.ExpressionRef = this.source     .codegen(cg);

		switch (this.name) {
			case TypeName.LIST: {
				switch (true) { // using `ast_type_name()` is too expensive
					// List.<T>((t, t, t));
					case this.source.type instanceof TYPE.Tuple: {
						return List.copyFromTuple(
							Value.cast(code_dest, reftype.List),
							Value.cast(code_src,  reftype.Tuple),
						);
					}
					// List.<T>([t, t, t]);
					// List.<T>(List.<T>((t, t, t)));
					case this.source.type instanceof TYPE.List: {
						return List.copyFromList(
							Value.cast(code_dest, reftype.List),
							Value.cast(code_src,  reftype.List),
						);
					}
					// List.<T>({t, t, t});
					// List.<T>(Set.<T>((t, t, t)));
					case this.source.type instanceof TYPE.Set: {
						return List.fillFromSet(
							Value.cast(code_dest, reftype.List),
							Value.cast(code_src,  reftype.Map),
						);
					}
					default: {
						return assert.fail(`Expected \`${this.source}\` to pass validation.`);
					}
				}
			}
			case TypeName.DICT: {
				switch (true) { // using `ast_type_name()` is too expensive
					// Dict.<T>(( (@a, t), (@b, t), (@c, t) ));
					case this.source.type instanceof TYPE.Tuple: {
						return Dict.fillFromTuple(
							Value.cast(code_dest, reftype.Dict),
							Value.cast(code_src,  reftype.Tuple),
						);
					}
					// Dict.<T>((a= t, b= t, c= t));
					case this.source.type instanceof TYPE.Record: {
						return Dict.copyFromRecord(
							Value.cast(code_dest, reftype.Dict),
							Value.cast(code_src,  reftype.Record),
						);
					}
					// Dict.<T>([ (@a, t), (@b, t), (@c, t) ]);
					// Dict.<T>(List.<(sym, T)>(( (@a, t), (@b, t), (@c, t) )));
					case this.source.type instanceof TYPE.List: {
						return Dict.fillFromList(
							Value.cast(code_dest, reftype.Dict),
							Value.cast(code_src,  reftype.List),
						);
					}
					// Dict.<T>([a= t, b= t, c= t]);
					// Dict.<T>(Dict.<T>( (a= t, b= t, c= t) ));
					case this.source.type instanceof TYPE.Dict: {
						return Dict.copyFromDict(
							Value.cast(code_dest, reftype.Dict),
							Value.cast(code_src,  reftype.Dict),
						);
					}
					// Dict.<T>({ (@a, t), (@b, t), (@c, t) });
					// Dict.<T>(Set.<(sym, T)>(( (@a, t), (@b, t), (@c, t) )));
					case this.source.type instanceof TYPE.Set: {
						return Dict.fillFromSet(
							Value.cast(code_dest, reftype.Dict),
							Value.cast(code_src,  reftype.Map),
						);
					}
					// Dict.<T>({@a -> t, @b -> t, @c -> t});
					// Dict.<T>(Map.<sym, T>(( (@a, t), (@b, t), (@c, t) )));
					case this.source.type instanceof TYPE.Map: {
						return Dict.fillFromMap(
							Value.cast(code_dest, reftype.Dict),
							Value.cast(code_src,  reftype.Map),
						);
					}
					default: {
						return assert.fail(`Expected \`${this.source}\` to pass validation.`);
					}
				}
			}
			case TypeName.SET: {
				switch (true) { // using `ast_type_name()` is too expensive
					// Set.<T>((t, t, t));
					case this.source.type instanceof TYPE.Tuple: {
						return VmMap.fillSetFromTuple(
							Value.cast(code_dest, reftype.Map),
							Value.cast(code_src,  reftype.Tuple),
						);
					}
					// Set.<T>([t, t, t]);
					// Set.<T>(List.<T>((t, t, t)));
					case this.source.type instanceof TYPE.List: {
						return VmMap.fillSetFromList(
							Value.cast(code_dest, reftype.Map),
							Value.cast(code_src,  reftype.List),
						);
					}
					// Set.<T>({t, t, t});
					// Set.<T>(Set.<T>((t, t, t)));
					case this.source.type instanceof TYPE.Set: {
						return VmMap.copyFromMap(
							Value.cast(code_dest, reftype.Map),
							Value.cast(code_src,  reftype.Map),
						);
					}
					default: {
						return assert.fail(`Expected \`${this.source}\` to pass validation.`);
					}
				}
			}
			case TypeName.MAP: {
				switch (true) { // using `ast_type_name()` is too expensive
					// Map.<K, V>(( (k, v), (k, v), (k, v) ));
					case this.source.type instanceof TYPE.Tuple: {
						return VmMap.fillFromTuple(
							Value.cast(code_dest, reftype.Map),
							Value.cast(code_src,  reftype.Tuple),
						);
					}
					// Map.<K, V>([ (k, v), (k, v), (k, v) ]);
					// Map.<K, V>(List.<(K, V)>(( (k, v), (k, v), (k, v) )));
					case this.source.type instanceof TYPE.List: {
						return VmMap.fillFromList(
							Value.cast(code_dest, reftype.Map),
							Value.cast(code_src,  reftype.List),
						);
					}
					// Map.<K, V>({ (k, v), (k, v), (k, v) });
					// Map.<K, V>(Set.<(K, V)>(( (k, v), (k, v), (k, v) )));
					case this.source.type instanceof TYPE.Set: {
						return VmMap.fillFromSet(
							Value.cast(code_dest, reftype.Map),
							Value.cast(code_src,  reftype.Map),
						);
					}
					// Map.<K, V>({k -> v, k -> v, k -> v});
					// Map.<K, V>(Map.<K, V>(( (k, v), (k, v), (k, v) )));
					case this.source.type instanceof TYPE.Map: {
						return VmMap.copyFromMap(
							Value.cast(code_dest, reftype.Map),
							Value.cast(code_src,  reftype.Map),
						);
					}
					default: {
						return assert.fail(`Expected \`${this.source}\` to pass validation.`);
					}
				}
			}
		}
	}
}
