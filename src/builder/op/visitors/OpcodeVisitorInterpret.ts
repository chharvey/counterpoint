import * as assert from 'node:assert';
import {assert_instanceof} from '../../../lib/index.ts';
import {VALUE} from '../../../typer/index.ts';
import {SymbolSchemaVar} from '../../../validator/index.ts';
import type {Interpreter} from '../../Interpreter.ts';
import {TypeName} from '../utils-public.ts';
import {
	OpcodeVisitor,
	type Opcode,
} from '../Opcode.ts';
import {NoValue} from '../NoValue.ts';
import type {Drop} from '../Drop.ts';
import type {Decl} from '../Decl.ts';
import type {Set as OpSet} from '../Set.ts';
import type {CollectionDynamicSet} from '../CollectionDynamicSet.ts';
import type {CollectionDynamicCopy} from '../CollectionDynamicCopy.ts';
import type {Return} from '../Return.ts';
import type {Goto} from '../Goto.ts';
import type {GotoConditional} from '../GotoConditional.ts';
import {ValueVisitorInterpret} from './ValueVisitorInterpret.ts';



/** Execute the interpreter. */
export class OpcodeVisitorInterpret extends OpcodeVisitor<void> {
	readonly #valueVisitorInterpret: ValueVisitorInterpret;


	public constructor(private readonly interp: Interpreter) {
		super();
		this.#valueVisitorInterpret = new ValueVisitorInterpret(interp);
	}


	public override visitDrop(instr: Drop): void {
		if (instr.value instanceof NoValue) {
			return;
		}
		return this.interp.pushDrop(this.#valueVisitorInterpret.visit(instr.value));
	}

	public override visitDecl(instr: Decl): void {
		if (instr.target instanceof SymbolSchemaVar) {
			// @ts-expect-error --- FIXME: function params do not have an initial value
			this.interp.setLocalValue(instr.target, instr.value && this.#valueVisitorInterpret.visit(instr.value));
		} else if (instr.target.value) {
			this.interp.setLocalValue(instr.target, this.#valueVisitorInterpret.visit(instr.target.value));
		}
	}

	public override visitSet(instr: OpSet): void {
		this.interp.setLocalValue(instr.target, this.#valueVisitorInterpret.visit(instr.value));
	}

	public override visitCollectionDynamicSet(instr: CollectionDynamicSet): void {
		const base:     VALUE.Value = this.#valueVisitorInterpret.visit(instr.collection);
		const accessor: VALUE.Value = this.#valueVisitorInterpret.visit(instr.accessor);
		const newvalue: VALUE.Value = this.#valueVisitorInterpret.visit(instr.value);
		switch (instr.name) {
			case TypeName.LIST: {
				assert_instanceof(base, VALUE.List);
				try {
					assert_instanceof(accessor, VALUE.Integer);
				} catch {
					assert_instanceof(accessor, VALUE.Natural);
				}
				return base.set(accessor.toBigInt(), newvalue);
			}
			case TypeName.DICT: {
				assert_instanceof(base, VALUE.Dict);
				try {
					assert_instanceof(accessor, VALUE.Symbol);
				} catch {
					assert_instanceof(accessor, VALUE.String);
					throw new Error('String keys for dict access are not yet supported.');
				}
				return base.set(accessor.id, newvalue);
			}
			case TypeName.SET: {
				assert_instanceof(base, VALUE.Set);
				return newvalue.equal(VALUE.TRUE)
					? base.put(accessor)
					: (assert.ok(newvalue.equal(VALUE.FALSE)), base.delete(accessor));
			}
			case TypeName.MAP: {
				assert_instanceof(base, VALUE.Map);
				return base.set(accessor, newvalue);
			}
		}
	}

	public override visitCollectionDynamicCopy(instr: CollectionDynamicCopy): void {
		const dest: VALUE.Value = this.#valueVisitorInterpret.visit(instr.destination);
		const src:  VALUE.Value = this.#valueVisitorInterpret.visit(instr.source);
		switch (instr.name) {
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
						throw new TypeError(`Expected \`${src}\` to be of type \`Tuple | List | Set\`.`); // TODO: make a new CplError class for case exhaustion
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
						throw new TypeError(`Expected \`${src}\` to be of type \`Tuple | Record | List | Dict | Set | Map\`.`); // TODO: make a new CplError class for case exhaustion
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
						throw new TypeError(`Expected \`${src}\` to be of type \`Tuple | List | Set\`.`); // TODO: make a new CplError class for case exhaustion
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
						throw new TypeError(`Expected \`${src}\` to be of type \`Tuple | List | Set | Map\`.`); // TODO: make a new CplError class for case exhaustion
					}
				}
			}
		}
	}

	public override visitReturn(instr: Return): void {
		instr;
		throw new Error('`OpcodeVisitorInterpret#visitReturn` not yet supported.');
	}

	public override visitGoto(term: Goto): void {
		return this.interp.interpretNextBlock(term.label);
	}

	public override visitGotoConditional(term: GotoConditional): void {
		const condition: VALUE.Value = this.#valueVisitorInterpret.visit(term.condition);
		return this.interp.interpretNextBlock(
			condition.equal(VALUE.TRUE)  ? term.labelIfTrue :
			condition.equal(VALUE.FALSE) ? term.labelIfFalse :
			assert.fail(new TypeError('Expected condition of a `GotoConditional` to be of type `Boolean`.')), // TODO: make a new CplError class for case exhaustion
		);
	}

	public override defaultVisit(_op: Opcode): void {
		return;
	}
}
