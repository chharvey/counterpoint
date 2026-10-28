import * as assert from 'node:assert';
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



interface ValueVisitorMethods<T> {
	visitTrap                 (val: Trap):                 T;
	visitConst                (val: Const):                T;
	visitGet                  (val: Get):                  T;
	visitTemplate             (val: Template):             T;
	visitCollectionLinearNew  (val: CollectionLinearNew):  T;
	visitRecordNew            (val: RecordNew):            T;
	visitDictNew              (val: DictNew):              T;
	visitMapNew               (val: MapNew):               T;
	visitMaybeNew             (val: MaybeNew):             T;
	visitTupleGet             (val: TupleGet):             T;
	visitRecordGet            (val: RecordGet):            T;
	visitCollectionDynamicGet (val: CollectionDynamicGet): T;
	visitCall                 (val: Call):                 T;
	visitUnop                 (val: Unop):                 T;
	visitInstance             (val: Instance):             T;
	visitBinop                (val: Binop):                T;

	defaultVisit(val: Value): T;
}
export class ValueVisitor<T> {
	public constructor(private readonly methods: Partial<ValueVisitorMethods<T>>) {}

	/** @final */
	public visit(val: Value): T {
		switch (val.constructor) {
			case Trap:                 { return this.methods.visitTrap                 ?.(val as Trap)                 ?? this.methods.defaultVisit?.(val) ?? assert.fail('Missing implementation.'); }
			case Const:                { return this.methods.visitConst                ?.(val as Const)                ?? this.methods.defaultVisit?.(val) ?? assert.fail('Missing implementation.'); }
			case Get:                  { return this.methods.visitGet                  ?.(val as Get)                  ?? this.methods.defaultVisit?.(val) ?? assert.fail('Missing implementation.'); }
			case Template:             { return this.methods.visitTemplate             ?.(val as Template)             ?? this.methods.defaultVisit?.(val) ?? assert.fail('Missing implementation.'); }
			case CollectionLinearNew:  { return this.methods.visitCollectionLinearNew  ?.(val as CollectionLinearNew)  ?? this.methods.defaultVisit?.(val) ?? assert.fail('Missing implementation.'); }
			case RecordNew:            { return this.methods.visitRecordNew            ?.(val as RecordNew)            ?? this.methods.defaultVisit?.(val) ?? assert.fail('Missing implementation.'); }
			case DictNew:              { return this.methods.visitDictNew              ?.(val as DictNew)              ?? this.methods.defaultVisit?.(val) ?? assert.fail('Missing implementation.'); }
			case MapNew:               { return this.methods.visitMapNew               ?.(val as MapNew)               ?? this.methods.defaultVisit?.(val) ?? assert.fail('Missing implementation.'); }
			case MaybeNew:             { return this.methods.visitMaybeNew             ?.(val as MaybeNew)             ?? this.methods.defaultVisit?.(val) ?? assert.fail('Missing implementation.'); }
			case TupleGet:             { return this.methods.visitTupleGet             ?.(val as TupleGet)             ?? this.methods.defaultVisit?.(val) ?? assert.fail('Missing implementation.'); }
			case RecordGet:            { return this.methods.visitRecordGet            ?.(val as RecordGet)            ?? this.methods.defaultVisit?.(val) ?? assert.fail('Missing implementation.'); }
			case CollectionDynamicGet: { return this.methods.visitCollectionDynamicGet ?.(val as CollectionDynamicGet) ?? this.methods.defaultVisit?.(val) ?? assert.fail('Missing implementation.'); }
			case Call:                 { return this.methods.visitCall                 ?.(val as Call)                 ?? this.methods.defaultVisit?.(val) ?? assert.fail('Missing implementation.'); }
			case Unop:                 { return this.methods.visitUnop                 ?.(val as Unop)                 ?? this.methods.defaultVisit?.(val) ?? assert.fail('Missing implementation.'); }
			case Instance:             { return this.methods.visitInstance             ?.(val as Instance)             ?? this.methods.defaultVisit?.(val) ?? assert.fail('Missing implementation.'); }
			case Binop:                { return this.methods.visitBinop                ?.(val as Binop)                ?? this.methods.defaultVisit?.(val) ?? assert.fail('Missing implementation.'); }
			default:                   { return                                                                           this.methods.defaultVisit?.(val) ?? assert.fail('Unexpected subclass.'); }
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
