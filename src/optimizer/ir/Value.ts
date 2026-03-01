import type {Optimizer} from '../Optimizer.ts';
import {Get} from './index.ts';
import type {Type} from './Type.ts';
import {Instruction} from './Instruction.ts';



/**
 * An Instruction to the internal representation (IR).
 *
 * Known subclasses:
 * - Trap
 * - Const
 * - Get
 * - CollectionLinearNew
 * - RecordNew
 * - DictNew
 * - MapNew
 * - TupleGet
 * - RecordGet
 * - CollectionDynamicGet
 * - Unop
 * - Binop
 */
export abstract class Value extends Instruction {
	/**
	 * @param type The type of the expression.
	 */
	public constructor(public readonly type: Type) {
		super();
	}

	/**
	 * Ensure that values use the Three-Address Code technique.
	 *
	 * Every binary operation should take the form of `t1 := t2 + t3`, and
	 * every unary operation should take the form of `t1 := -t2`.
	 * Nested operations such as `!(5 + -x * 2 - 3)`, instead of a tree-like structure:
	 * ```
	 * (NOT (SUB (ADD 5 (MUL (NEG x) 2)) 3))
	 * ```
	 * become flattened with the use of temporary locals:
	 * ```
	 * (SET $0 (NEG x))          ;; t0 := -x
	 * (SET $1 (MUL $0 2))       ;; t1 := t0 * 2
	 * (SET $2 (ADD 5 (GET $1))) ;; t2 := 5 + t1
	 * (SET $3 (SUB (GET $2) 3)) ;; t3 := t2 - 3
	 * (GET $3)                  ;; t3
	 * ```
	 *
	 * If this value is already a unit (constant or variable), override this method to return that value;
	 * otherwise, store the value in a local and return a {@link Get}.
	 *
	 * @param optimizer
	 * @return          this value, or a GET of this value
	 * @see https://en.wikipedia.org/wiki/Three-address_code
	 */
	public asTac(optimizer: Optimizer): Value {
		return new Get(optimizer.newTempLocal(this));
	}
}
