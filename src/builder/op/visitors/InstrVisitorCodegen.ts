import * as assert from 'node:assert';
import type * as binaryen from 'binaryen.ts';
import type {
	CodeGenerator,
	Local,
	VirtualMachine,
} from '../../../index.ts';
import {TYPE} from '../../../typer/index.ts';
import {TypeName} from '../utils-public.ts';
import {
	InstrVisitor,
	type Instruction,
} from '../Instruction.ts';
import type {Drop} from '../Drop.ts';
import type {Decl} from '../Decl.ts';
import type {Set as OpSet} from '../Set.ts';
import type {CollectionDynamicSet} from '../CollectionDynamicSet.ts';
import type {CollectionDynamicCopy} from '../CollectionDynamicCopy.ts';
import type {Return} from '../Return.ts';
import {memoizePerCode} from './decorators.ts';
import {ValueVisitorCodegen} from './ValueVisitorCodegen.ts';



/**
 * Generate assembly code.
 *
 * Returns a Binaryen expression of empty type (“`binaryen.none`”, not the WASM `none` heap type).
 */
export class InstrVisitorCodegen extends InstrVisitor<binaryen.ExpressionRef /* void */> {
	readonly #valueVisitorCodegen: ValueVisitorCodegen;

	private readonly wasm:     binaryen.ExpressionBuilder;
	private readonly heaptype: VirtualMachine['heaptype'];
	private readonly reftype:  VirtualMachine['reftype'];


	public constructor(private readonly cg: CodeGenerator) {
		super();
		this.#valueVisitorCodegen = new ValueVisitorCodegen(cg);
		this.wasm     = cg.mod.wasm;
		this.heaptype = cg.vm.heaptype;
		this.reftype  = cg.vm.reftype;
	}


	@memoizePerCode
	public override visitDrop(instr: Drop): binaryen.ExpressionRef /* void */ {
		return this.wasm.drop(this.#valueVisitorCodegen.visit(instr.value));
	}

	@memoizePerCode
	public override visitDecl(instr: Decl): binaryen.ExpressionRef /* void */ {
		return this.cg.teeLocal(instr.target, instr.value ? this.#valueVisitorCodegen.visit(instr.value) : this.wasm.struct.new_default(this.heaptype.Value)).set();
	}

	@memoizePerCode
	public override visitSet(instr: OpSet): binaryen.ExpressionRef /* void */ {
		return this.cg.getLocal(instr.target)?.set(this.#valueVisitorCodegen.visit(instr.value)) ?? assert.fail(new ReferenceError(`Local variable \`${instr.targetName}\` must be set first!`));
	}

	@memoizePerCode
	public override visitCollectionDynamicSet(instr: CollectionDynamicSet): binaryen.ExpressionRef /* void */ {
		const {Vect, Value, List, Dict, Map: VmMap} = this.cg.vm;

		const collection: binaryen.ExpressionRef = this.#valueVisitorCodegen.visit(instr.collection);
		const accessor:   binaryen.ExpressionRef = this.#valueVisitorCodegen.visit(instr.accessor);
		const value:      binaryen.ExpressionRef = this.#valueVisitorCodegen.visit(instr.value);
		switch (instr.name) {
			case TypeName.LIST: {
				return List.set(
					Value.asList(collection),
					this.wasm.i32.wrap_i64(Vect.asInt(Value.asPrimitive(accessor))),
					value,
				);
			}
			case TypeName.DICT: {
				return Dict.set(
					Value.asDict(collection),
					Vect.asNat(Value.asPrimitive(accessor)),
					value,
				);
			}
			case TypeName.SET: {
				const base: Local = this.cg.newLocal(Value.asMap(collection));
				const xsor: Local = this.cg.newLocal(accessor, this.reftype.Value);
				return this.wasm.block(null, [
					base.set(),
					xsor.set(),
					this.wasm.if(
						Vect.isConst(Value.asPrimitive(value), true),
						VmMap.set(
							base.get(),
							xsor.get(),
							Value.NULL,
						),
						this.wasm.drop(VmMap.delete(
							base.get(),
							xsor.get(),
						)),
					),
				]);
			}
			case TypeName.MAP: {
				return VmMap.set(
					Value.asMap(collection),
					accessor,
					value,
				);
			}
		}
	}

	@memoizePerCode
	public override visitCollectionDynamicCopy(instr: CollectionDynamicCopy): binaryen.ExpressionRef /* void */ {
		const {Value: VmValue, List, Dict, Map: VmMap} = this.cg.vm;

		const code_dest: binaryen.ExpressionRef = this.#valueVisitorCodegen.visit(instr.destination);
		const code_src:  binaryen.ExpressionRef = this.#valueVisitorCodegen.visit(instr.source);

		switch (instr.name) {
			case TypeName.LIST: {
				switch (instr.source.type.constructor) {
					// List.<T>((t, t, t));
					case TYPE.Tuple: {
						return List.copyFromTuple(
							VmValue.asList(code_dest),
							VmValue.asTuple(code_src),
						);
					}
					// List.<T>([t, t, t]);
					// List.<T>(List.<T>((t, t, t)));
					case TYPE.List: {
						return List.copyFromList(
							VmValue.asList(code_dest),
							VmValue.asList(code_src),
						);
					}
					// List.<T>({t, t, t});
					// List.<T>(Set.<T>((t, t, t)));
					case TYPE.Set: {
						return List.fillFromSet(
							VmValue.asList(code_dest),
							VmValue.asMap(code_src),
						);
					}
					default: {
						return assert.fail(`Expected \`${instr.source}\` to pass validation.`); // TODO: make a new CplError class for case exhaustion
					}
				}
			}
			case TypeName.DICT: {
				switch (instr.source.type.constructor) {
					// Dict.<T>(( (@a, t), (@b, t), (@c, t) ));
					case TYPE.Tuple: {
						return Dict.fillFromTuple(
							VmValue.asDict(code_dest),
							VmValue.asTuple(code_src),
						);
					}
					// Dict.<T>((a= t, b= t, c= t));
					case TYPE.Record: {
						return Dict.copyFromRecord(
							VmValue.asDict(code_dest),
							VmValue.asRecord(code_src),
						);
					}
					// Dict.<T>([ (@a, t), (@b, t), (@c, t) ]);
					// Dict.<T>(List.<(sym, T)>(( (@a, t), (@b, t), (@c, t) )));
					case TYPE.List: {
						return Dict.fillFromList(
							VmValue.asDict(code_dest),
							VmValue.asList(code_src),
						);
					}
					// Dict.<T>([a= t, b= t, c= t]);
					// Dict.<T>(Dict.<T>( (a= t, b= t, c= t) ));
					case TYPE.Dict: {
						return Dict.copyFromDict(
							VmValue.asDict(code_dest),
							VmValue.asDict(code_src),
						);
					}
					// Dict.<T>({ (@a, t), (@b, t), (@c, t) });
					// Dict.<T>(Set.<(sym, T)>(( (@a, t), (@b, t), (@c, t) )));
					case TYPE.Set: {
						return Dict.fillFromSet(
							VmValue.asDict(code_dest),
							VmValue.asMap(code_src),
						);
					}
					// Dict.<T>({@a -> t, @b -> t, @c -> t});
					// Dict.<T>(Map.<sym, T>(( (@a, t), (@b, t), (@c, t) )));
					case TYPE.Map: {
						return Dict.fillFromMap(
							VmValue.asDict(code_dest),
							VmValue.asMap(code_src),
						);
					}
					default: {
						return assert.fail(`Expected \`${instr.source}\` to pass validation.`); // TODO: make a new CplError class for case exhaustion
					}
				}
			}
			case TypeName.SET: {
				switch (instr.source.type.constructor) {
					// Set.<T>((t, t, t));
					case TYPE.Tuple: {
						return VmMap.fillSetFromTuple(
							VmValue.asMap(code_dest),
							VmValue.asTuple(code_src),
						);
					}
					// Set.<T>([t, t, t]);
					// Set.<T>(List.<T>((t, t, t)));
					case TYPE.List: {
						return VmMap.fillSetFromList(
							VmValue.asMap(code_dest),
							VmValue.asList(code_src),
						);
					}
					// Set.<T>({t, t, t});
					// Set.<T>(Set.<T>((t, t, t)));
					case TYPE.Set: {
						return VmMap.copyFromMap(
							VmValue.asMap(code_dest),
							VmValue.asMap(code_src),
						);
					}
					default: {
						return assert.fail(`Expected \`${instr.source}\` to pass validation.`); // TODO: make a new CplError class for case exhaustion
					}
				}
			}
			case TypeName.MAP: {
				switch (instr.source.type.constructor) {
					// Map.<K, V>(( (k, v), (k, v), (k, v) ));
					case TYPE.Tuple: {
						return VmMap.fillFromTuple(
							VmValue.asMap(code_dest),
							VmValue.asTuple(code_src),
						);
					}
					// Map.<K, V>([ (k, v), (k, v), (k, v) ]);
					// Map.<K, V>(List.<(K, V)>(( (k, v), (k, v), (k, v) )));
					case TYPE.List: {
						return VmMap.fillFromList(
							VmValue.asMap(code_dest),
							VmValue.asList(code_src),
						);
					}
					// Map.<K, V>({ (k, v), (k, v), (k, v) });
					// Map.<K, V>(Set.<(K, V)>(( (k, v), (k, v), (k, v) )));
					case TYPE.Set: {
						return VmMap.fillFromSet(
							VmValue.asMap(code_dest),
							VmValue.asMap(code_src),
						);
					}
					// Map.<K, V>({k -> v, k -> v, k -> v});
					// Map.<K, V>(Map.<K, V>(( (k, v), (k, v), (k, v) )));
					case TYPE.Map: {
						return VmMap.copyFromMap(
							VmValue.asMap(code_dest),
							VmValue.asMap(code_src),
						);
					}
					default: {
						return assert.fail(`Expected \`${instr.source}\` to pass validation.`); // TODO: make a new CplError class for case exhaustion
					}
				}
			}
		}
	}

	@memoizePerCode
	public override visitReturn(instr: Return): binaryen.ExpressionRef /* void */ {
		const value: binaryen.ExpressionRef = this.#valueVisitorCodegen.visit(instr.value);
		return this.wasm.return(this.wasm.tuple.make((instr.isReturn
			? [value, this.wasm.ref.null(this.heaptype.Exception)]
			: [this.wasm.ref.null(this.heaptype.Value), value]
		)));
	}

	public override defaultVisit(_instr: Instruction): binaryen.ExpressionRef /* void */ {
		return this.wasm.nop();
	}
}
