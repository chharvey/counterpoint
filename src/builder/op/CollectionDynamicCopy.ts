import * as assert from 'node:assert';
import type * as binaryen from 'binaryen.ts';
import type {CodeGenerator} from '../../index.ts';
import {memoizeMethod} from '../../lib/index.ts';
import {TYPE} from '../../typer/index.ts';
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
		public readonly name:        CollectionDynamicName,
		public readonly destination: ValueTac,
		public readonly source:      ValueTac,
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

	@memoizeMethod
	public override codegen(cg: CodeGenerator): binaryen.ExpressionRef {
		const {Value, List, Dict, Map: VmMap} = cg.vm;

		const code_dest: binaryen.ExpressionRef = this.destination.codegen(cg);
		const code_src:  binaryen.ExpressionRef = this.source     .codegen(cg);

		switch (this.name) {
			case TypeName.LIST: {
				switch (true) { // using `ast_type_name()` is too expensive
					// List.<T>((t, t, t));
					case this.source.type instanceof TYPE.Tuple: {
						return List.copyFromTuple(
							Value.asList(code_dest),
							Value.asTuple(code_src),
						);
					}
					// List.<T>([t, t, t]);
					// List.<T>(List.<T>((t, t, t)));
					case this.source.type instanceof TYPE.List: {
						return List.copyFromList(
							Value.asList(code_dest),
							Value.asList(code_src),
						);
					}
					// List.<T>({t, t, t});
					// List.<T>(Set.<T>((t, t, t)));
					case this.source.type instanceof TYPE.Set: {
						return List.fillFromSet(
							Value.asList(code_dest),
							Value.asMap(code_src),
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
							Value.asDict(code_dest),
							Value.asTuple(code_src),
						);
					}
					// Dict.<T>((a= t, b= t, c= t));
					case this.source.type instanceof TYPE.Record: {
						return Dict.copyFromRecord(
							Value.asDict(code_dest),
							Value.asRecord(code_src),
						);
					}
					// Dict.<T>([ (@a, t), (@b, t), (@c, t) ]);
					// Dict.<T>(List.<(sym, T)>(( (@a, t), (@b, t), (@c, t) )));
					case this.source.type instanceof TYPE.List: {
						return Dict.fillFromList(
							Value.asDict(code_dest),
							Value.asList(code_src),
						);
					}
					// Dict.<T>([a= t, b= t, c= t]);
					// Dict.<T>(Dict.<T>( (a= t, b= t, c= t) ));
					case this.source.type instanceof TYPE.Dict: {
						return Dict.copyFromDict(
							Value.asDict(code_dest),
							Value.asDict(code_src),
						);
					}
					// Dict.<T>({ (@a, t), (@b, t), (@c, t) });
					// Dict.<T>(Set.<(sym, T)>(( (@a, t), (@b, t), (@c, t) )));
					case this.source.type instanceof TYPE.Set: {
						return Dict.fillFromSet(
							Value.asDict(code_dest),
							Value.asMap(code_src),
						);
					}
					// Dict.<T>({@a -> t, @b -> t, @c -> t});
					// Dict.<T>(Map.<sym, T>(( (@a, t), (@b, t), (@c, t) )));
					case this.source.type instanceof TYPE.Map: {
						return Dict.fillFromMap(
							Value.asDict(code_dest),
							Value.asMap(code_src),
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
							Value.asMap(code_dest),
							Value.asTuple(code_src),
						);
					}
					// Set.<T>([t, t, t]);
					// Set.<T>(List.<T>((t, t, t)));
					case this.source.type instanceof TYPE.List: {
						return VmMap.fillSetFromList(
							Value.asMap(code_dest),
							Value.asList(code_src),
						);
					}
					// Set.<T>({t, t, t});
					// Set.<T>(Set.<T>((t, t, t)));
					case this.source.type instanceof TYPE.Set: {
						return VmMap.copyFromMap(
							Value.asMap(code_dest),
							Value.asMap(code_src),
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
							Value.asMap(code_dest),
							Value.asTuple(code_src),
						);
					}
					// Map.<K, V>([ (k, v), (k, v), (k, v) ]);
					// Map.<K, V>(List.<(K, V)>(( (k, v), (k, v), (k, v) )));
					case this.source.type instanceof TYPE.List: {
						return VmMap.fillFromList(
							Value.asMap(code_dest),
							Value.asList(code_src),
						);
					}
					// Map.<K, V>({ (k, v), (k, v), (k, v) });
					// Map.<K, V>(Set.<(K, V)>(( (k, v), (k, v), (k, v) )));
					case this.source.type instanceof TYPE.Set: {
						return VmMap.fillFromSet(
							Value.asMap(code_dest),
							Value.asMap(code_src),
						);
					}
					// Map.<K, V>({k -> v, k -> v, k -> v});
					// Map.<K, V>(Map.<K, V>(( (k, v), (k, v), (k, v) )));
					case this.source.type instanceof TYPE.Map: {
						return VmMap.copyFromMap(
							Value.asMap(code_dest),
							Value.asMap(code_src),
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
