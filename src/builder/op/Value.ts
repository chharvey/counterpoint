import type * as binaryen from 'binaryen.ts';
import type {CodeGenerator} from '../../index.ts';
import type {
	VALUE,
	TYPE,
} from '../../typer/index.ts';
import type {
	Temp,
	Builder,
} from '../Builder.ts';
import type {Interpreter} from '../Interpreter.ts';
import {
	type ValueTac,
	Get,
	Decl,
} from './index.ts';
import {
	type OpCode,
	Opcode,
} from './Opcode.ts';



/**
 * Known subclasses:
 * - ValueTac
 * - Template
 * - CollectionLinearNew
 * - RecordNew
 * - DictNew
 * - MapNew
 * - TupleGet
 * - RecordGet
 * - CollectionDynamicGet
 * - Call
 * - Isset
 * - Unop
 * - Binop
 * - Phi
 * - OpFunction
 */
export abstract class Value extends Opcode {
	/**
	 * @param type The type of the expression.
	 */
	public constructor(
		op_code: OpCode,
		public readonly type: TYPE.Type,
	) {
		super(op_code);
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
	 * Similarly, any compound objects (tuples, templates, etc.) should only contain TAC-formatted values.
	 *
	 * If this value is already a unit (constant or variable), override this method to return that value;
	 * otherwise, store the value in a local and return a {@link Get}.
	 *
	 * @param builder
	 * @return          this value, or a GET of this value
	 * @see https://en.wikipedia.org/wiki/Three-address_code
	 */
	public asTac(builder: Builder): ValueTac {
		const temp: Temp = builder.newTemp(this);
		builder.pushInstruction(new Decl(temp));
		return new Get(temp);
	}

	/**
	 * Execute the interpreter.
	 * @param   interp an Interpreter
	 * @returns a runtime value in the interpreter
	 */
	public abstract interpret(interp: Interpreter): VALUE.Value;

	/**
	 * Generate assembly code.
	 * @param  cg code-generator
	 * @return    a binaryen expression of type `(ref $Value)`
	 */
	public abstract codegen(cg: CodeGenerator): binaryen.ExpressionRef;
}
