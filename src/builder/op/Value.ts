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
	Trap,
	Const,
	Get,
	Template,
	CollectionLinearNew,
	RecordNew,
	DictNew,
	MapNew,
	MaybeNew,
	TupleGet,
	RecordGet,
	CollectionDynamicGet,
	Call,
	Unop,
	Instance,
	Binop,
	Decl,
} from './index.ts';
import {
	type OpCode,
	Opcode,
} from './Opcode.ts';



export abstract class ValueVisitor<T> {
	/* eslint-disable @stylistic/space-before-function-paren */
	public visitTrap                 (val: Trap):                 T { return this.defaultVisit(val); }
	public visitConst                (val: Const):                T { return this.defaultVisit(val); }
	public visitGet                  (val: Get):                  T { return this.defaultVisit(val); }
	public visitTemplate             (val: Template):             T { return this.defaultVisit(val); }
	public visitCollectionLinearNew  (val: CollectionLinearNew):  T { return this.defaultVisit(val); }
	public visitRecordNew            (val: RecordNew):            T { return this.defaultVisit(val); }
	public visitDictNew              (val: DictNew):              T { return this.defaultVisit(val); }
	public visitMapNew               (val: MapNew):               T { return this.defaultVisit(val); }
	public visitMaybeNew             (val: MaybeNew):             T { return this.defaultVisit(val); }
	public visitTupleGet             (val: TupleGet):             T { return this.defaultVisit(val); }
	public visitRecordGet            (val: RecordGet):            T { return this.defaultVisit(val); }
	public visitCollectionDynamicGet (val: CollectionDynamicGet): T { return this.defaultVisit(val); }
	public visitCall                 (val: Call):                 T { return this.defaultVisit(val); }
	public visitUnop                 (val: Unop):                 T { return this.defaultVisit(val); }
	public visitInstance             (val: Instance):             T { return this.defaultVisit(val); }
	public visitBinop                (val: Binop):                T { return this.defaultVisit(val); }
	/* eslint-enable @stylistic/space-before-function-paren */

	public abstract defaultVisit(val: Value): T;

	/** @final */
	public visit(val: Value): T {
		switch (val.constructor) {
			case Trap:                 { return this.visitTrap                 (val as Trap); }
			case Const:                { return this.visitConst                (val as Const); }
			case Get:                  { return this.visitGet                  (val as Get); }
			case Template:             { return this.visitTemplate             (val as Template); }
			case CollectionLinearNew:  { return this.visitCollectionLinearNew  (val as CollectionLinearNew); }
			case RecordNew:            { return this.visitRecordNew            (val as RecordNew); }
			case DictNew:              { return this.visitDictNew              (val as DictNew); }
			case MapNew:               { return this.visitMapNew               (val as MapNew); }
			case MaybeNew:             { return this.visitMaybeNew             (val as MaybeNew); }
			case TupleGet:             { return this.visitTupleGet             (val as TupleGet); }
			case RecordGet:            { return this.visitRecordGet            (val as RecordGet); }
			case CollectionDynamicGet: { return this.visitCollectionDynamicGet (val as CollectionDynamicGet); }
			case Call:                 { return this.visitCall                 (val as Call); }
			case Unop:                 { return this.visitUnop                 (val as Unop); }
			case Instance:             { return this.visitInstance             (val as Instance); }
			case Binop:                { return this.visitBinop                (val as Binop); }

			default: { return this.defaultVisit(val); }
		}
	}
}



/**
 * Known subclasses:
 * - ValueTac
 * - Template
 * - CollectionLinearNew
 * - RecordNew
 * - DictNew
 * - MapNew
 * - MaybeNew
 * - TupleGet
 * - RecordGet
 * - CollectionDynamicGet
 * - Call
 * - Unop
 * - Instance
 * - Binop
 * - Phi
 */
export abstract class Value extends Opcode {
	/**
	 * @param type The type of the Opcode expression.
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
