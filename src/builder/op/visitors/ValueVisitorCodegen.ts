import * as assert from 'node:assert';
import * as binaryen from 'binaryen.ts';
import type {
	CodeGenerator,
	Local,
	VirtualMachine,
} from '../../../index.ts';
import {noopMethod} from '../../../lib/index.ts';
import {
	CoreLibName,
	CORE_LIB_NAMES,
} from '../../../parser/index.ts';
import {SymbolSchemaClass} from '../../../validator/index.ts';
import {TypeName} from '../utils-public.ts';
import {OpCode} from '../Opcode.ts';
import {
	ValueVisitor,
	type Value,
} from '../Value.ts';
import type {NoValue} from '../NoValue.ts';
import type {Const} from '../Const.ts';
import type {Get} from '../Get.ts';
import type {Template} from '../Template.ts';
import type {CollectionLinearNew} from '../CollectionLinearNew.ts';
import type {RecordNew} from '../RecordNew.ts';
import type {DictNew} from '../DictNew.ts';
import type {MapNew} from '../MapNew.ts';
import type {ObjectNew} from '../ObjectNew.ts';
import type {ExcpNew} from '../ExcpNew.ts';
import type {MaybeNew} from '../MaybeNew.ts';
import type {ResultNew} from '../ResultNew.ts';
import type {TupleHas} from '../TupleHas.ts';
import type {RecordHas} from '../RecordHas.ts';
import type {TupleGet} from '../TupleGet.ts';
import type {RecordGet} from '../RecordGet.ts';
import type {CollectionDynamicGet} from '../CollectionDynamicGet.ts';
import type {Call} from '../Call.ts';
import type {Unop} from '../Unop.ts';
import type {Binop} from '../Binop.ts';
import type {Function as OpFunction} from '../Function.ts';
import {memoizePerCode} from './decorators.ts';



/**
 * Generate assembly code.
 *
 * Returns a Binaryen expression of type `(ref $Value)`.
 */
export class ValueVisitorCodegen extends ValueVisitor<binaryen.ExpressionRef /* (ref $Value) */> {
	private readonly wasm:     binaryen.ExpressionBuilder;
	private readonly heaptype: VirtualMachine['heaptype'];
	private readonly reftype:  VirtualMachine['reftype'];


	public constructor(private readonly cg: CodeGenerator) {
		super();
		this.wasm        = cg.mod.wasm;
		this.heaptype    = cg.vm.heaptype;
		this.reftype     = cg.vm.reftype;
	}


	@noopMethod(memoizePerCode)
	public override visitNoValue(val: NoValue): binaryen.ExpressionRef /* (ref $Value) */ {
		return val.isVoid ? this.cg.vm.Value.VOID : this.cg.mod.wasm.unreachable();
	}

	@memoizePerCode
	public override visitConst(val: Const): binaryen.ExpressionRef /* (ref $Value) */ {
		return val.interpreterValue.codegen(this.cg);
	}

	@memoizePerCode
	public override visitGet(val: Get): binaryen.ExpressionRef /* (ref $Value) */ {
		if (
			val.target instanceof SymbolSchemaClass &&
			CORE_LIB_NAMES.includes(val.target.source as CoreLibName)
		) {
			switch (val.target.source) {
				case CoreLibName.NULL:      { return this.cg.vm.Class.NULL; }
				case CoreLibName.BOOLEAN:   { return this.cg.vm.Class.BOOLEAN; }
				case CoreLibName.SYMBOL:    { return this.cg.vm.Class.SYMBOL; }
				case CoreLibName.INTEGER:   { return this.cg.vm.Class.INTEGER; }
				case CoreLibName.NATURAL:   { return this.cg.vm.Class.NATURAL; }
				case CoreLibName.FLOAT:     { return this.cg.vm.Class.FLOAT; }
				case CoreLibName.STRING:    { return this.cg.vm.Class.STRING; }
				case CoreLibName.OBJECT:    { return this.cg.vm.Class.OBJECT; }
				case CoreLibName.LIST:      { return this.cg.vm.Class.LIST; }
				case CoreLibName.DICT:      { return this.cg.vm.Class.DICT; }
				case CoreLibName.SET:       { return this.cg.vm.Class.SET; }
				case CoreLibName.MAP:       { return this.cg.vm.Class.MAP; }
				case CoreLibName.EXCEPTION: { return this.cg.vm.Class.EXCEPTION; }
				case CoreLibName.MAYBE:     { return this.cg.vm.Class.MAYBE; }
				case CoreLibName.NONE:      { return this.cg.vm.Class.NONE; }
				case CoreLibName.SOME:      { return this.cg.vm.Class.SOME; }
				case CoreLibName.RESULT:    { return this.cg.vm.Class.RESULT; }
				case CoreLibName.FAIL:      { return this.cg.vm.Class.FAIL; }
				case CoreLibName.OK:        { return this.cg.vm.Class.OK; }
				case CoreLibName.FUNCTION:  { return this.cg.vm.Class.FUNCTION; }
				case CoreLibName.CLASS:     { return this.cg.vm.Class.CLASS; }
				default: {
					return this.cg.codegenClass(this.cg.vm.Class.CLASS); // returns a new class who is an instance of `Class`
				}
			}
		}
		return this.cg.getLocal(val.target)?.get() ?? assert.fail(new ReferenceError(`Local variable \`${val.targetName}\` must be set first!`));
	}

	@memoizePerCode
	public override visitTemplate(val: Template): binaryen.ExpressionRef /* (ref $Value) */ {
		const {Value: VmValue} = this.cg.vm;
		const strings: readonly Local[]                  = val.items.map((item) => this.cg.newLocal(VmValue.asString(this.visit(item))));
		const lengths: readonly binaryen.ExpressionRef[] = strings.map((strarr) => this.wasm.array.len(strarr.get()));

		const result: Local = this.cg.newLocal(this.wasm.array.new_default(this.heaptype.String, lengths.reduce((a, b) => this.wasm.i32.add(a, b))));
		const offset: Local = this.cg.newLocal(this.wasm.i32.const(0));

		return this.wasm.block(null, [
			...strings.map((strarr) => strarr.set()),
			result.set(),
			offset.set(),
			...strings.flatMap((strarr, i) => [
				this.wasm.array.copy(
					result.get(),
					offset.get(),
					strarr.get(),
					this.wasm.i32.const(0),
					lengths[i],
				),
				offset.set(this.wasm.i32.add(offset.get(), lengths[i])),
			]).slice(0, -1), // slice off the last `offset.set`
			VmValue.fromString(result.get()),
		], this.reftype.Value);
	}

	@memoizePerCode
	public override visitCollectionLinearNew(val: CollectionLinearNew): binaryen.ExpressionRef /* (ref $Value) */ {
		switch (val.name) {
			case TypeName.TUPLE: { return this.cg.vm.Value.fromTuple (this.cg.codegenTuple (val.items.map((item) => this.visit(item)))); }
			case TypeName.LIST:  { return this.cg.vm.Value.fromList  (this.cg.codegenList  (val.items.map((item) => this.visit(item)))); }
			case TypeName.SET:   { return this.cg.vm.Value.fromMap   (this.cg.codegenSet   (val.items.map((item) => this.visit(item)))); }
		}
	}

	@memoizePerCode
	public override visitRecordNew(val: RecordNew): binaryen.ExpressionRef /* (ref $Value) */ {
		return this.cg.vm.Value.fromRecord(this.cg.codegenRecord(new Map<bigint, binaryen.ExpressionRef>([...val.props].map(([id, value]) => [
			id,
			this.cg.newProperty(id, this.visit(value)),
		]))));
	}

	@memoizePerCode
	public override visitDictNew(val: DictNew): binaryen.ExpressionRef /* (ref $Value) */ {
		return this.cg.vm.Value.fromDict(this.cg.codegenDict(new Map<bigint, binaryen.ExpressionRef>([...val.props].map(([id, value]) => [
			id,
			this.cg.newProperty(id, this.visit(value)),
		]))));
	}

	@memoizePerCode
	public override visitMapNew(val: MapNew): binaryen.ExpressionRef /* (ref $Value) */ {
		return this.cg.vm.Value.fromMap(this.cg.codegenMap(new Map([...val.cases].map(([ant, con]) => [
			this.visit(ant),
			this.visit(con),
		]))));
	}

	@memoizePerCode
	public override visitObjectNew(val: ObjectNew): binaryen.ExpressionRef /* (ref $Value) */ {
		const class_: binaryen.ExpressionRef /* (ref $Class) */ | undefined = val.class_ && this.wasm.ref.cast(this.visit(val.class_), this.reftype.Class);
		return val.isClass ? this.cg.codegenClass(class_) : this.cg.codegenObject(class_!);
	}

	@memoizePerCode
	public override visitExcpNew(val: ExcpNew): binaryen.ExpressionRef /* (ref $Value) */ {
		return this.cg.codegenException(
			this.wasm.ref.cast(this.visit(val.message), this.reftype.CplString),
			val.cause ? this.wasm.ref.cast(this.visit(val.cause), this.reftype.Exception) : undefined,
		);
	}

	@memoizePerCode
	public override visitMaybeNew(val: MaybeNew): binaryen.ExpressionRef /* (ref $Value) */ {
		return this.cg.codegenMaybe(val.value && this.visit(val.value));
	}

	@memoizePerCode
	public override visitResultNew(val: ResultNew): binaryen.ExpressionRef /* (ref $Value) */ {
		let argument: binaryen.ExpressionRef /* (ref $Value) */ = this.visit(val.argument);
		if (!val.isOk) {
			argument /* (ref $Exception) */ = this.wasm.ref.cast(argument, this.reftype.Exception);
		}
		return this.cg.codegenResult(val.isOk, argument);
	}

	@memoizePerCode
	public override visitTupleHas(val: TupleHas): binaryen.ExpressionRef /* (ref $Value) */ {
		return this.cg.vm.Value.boolFromI32(this.wasm.i32.lt_u(
			this.wasm.i32.const(Number(val.accessor)),
			this.wasm.array.len(this.cg.vm.Value.asTuple(this.visit(val.tuple))),
		));
	}

	@memoizePerCode
	public override visitRecordHas(val: RecordHas): binaryen.ExpressionRef /* (ref $Value) */ {
		return this.cg.vm.Value.boolFromI32(this.cg.vm.Record.hasKey(
			this.cg.vm.Value.asRecord(this.visit(val.record)),
			this.wasm.i64.const(val.accessor),
		));
	}

	@memoizePerCode
	public override visitTupleGet(val: TupleGet): binaryen.ExpressionRef /* (ref $Value) */ {
		return this.wasm.array.get(
			this.cg.vm.Value.asTuple(this.visit(val.tuple)),
			this.wasm.i32.const(Number(val.accessor)),
			this.reftype.Value,
		);
	}

	@memoizePerCode
	public override visitRecordGet(val: RecordGet): binaryen.ExpressionRef /* (ref $Value) */ {
		return this.cg.vm.Record.get(
			this.cg.vm.Value.asRecord(this.visit(val.record)),
			this.wasm.i64.const(val.accessor),
		);
	}

	@memoizePerCode
	public override visitCollectionDynamicGet(val: CollectionDynamicGet): binaryen.ExpressionRef /* (ref $Value) */ {
		const {Vect, Value: VmValue, Case, List, Dict, Map: VmMap} = this.cg.vm;

		const collection: binaryen.ExpressionRef = this.visit(val.collection);
		const accessor:   binaryen.ExpressionRef = this.visit(val.accessor);
		/*
		 * The IR already handled logic for if the collection itself is nullish, so assume by this point it’s not.
		 * But we still need to check for nullish values in the collection.
		 */
		switch (val.name) {
			case TypeName.LIST: {
				return List.get(
					VmValue.asList(collection),
					this.wasm.i32.wrap_i64(Vect.asInt(VmValue.asPrimitive(accessor))),
				);
			}
			case TypeName.DICT: {
				return Dict.get(
					VmValue.asDict(collection),
					Vect.asNat(VmValue.asPrimitive(accessor)),
				);
			}
			case TypeName.SET: {
				const nullish_case: Local = this.cg.newLocal(this.wasm.tuple.extract(VmMap.find(
					VmValue.asMap(collection),
					accessor,
				), 1));

				return this.wasm.block(null, [
					nullish_case.set(),
					// if `(ref.null $Case)` or a tombstone is returned, return Counterpoint `false`; else return `true`
					this.wasm.if(
						this.wasm.i32.or(
							this.wasm.ref.is_null(nullish_case.get()),
							this.wasm.ref.eq(nullish_case.get(), Case.TOMBSTONE),
						),
						VmValue.FALSE,
						VmValue.TRUE,
					),
				], this.reftype.Value);
			}
			case TypeName.MAP: {
				return VmMap.get(
					VmValue.asMap(collection),
					accessor,
				);
			}
		}
	}

	@memoizePerCode
	public override visitCall(val: Call): binaryen.ExpressionRef /* (ref $Value) */ {
		const {vm: {reftype, reftypeNull, Value: VmValue}, mod: {wasm}} = this.cg;

		const result: Local = this.cg.newLocal(wasm.call_ref(
			VmValue.asFunc(this.visit(val.callable)),
			[
				this.cg.codegenList(),
				this.cg.codegenList([
					...val.argsPosit.map((arg) => this.visit(arg)),
					...[...val.argsNamed].map(([_, arg]) => this.visit(arg)), // FIXME: sort these by parameter order
				]),
			],
			binaryen.createType([reftypeNull.Value, reftypeNull.Exception]),
		));

		return wasm.block(null, [
			result.set(),
			wasm.if(
				wasm.ref.is_null(wasm.tuple.extract(result.get(), 1)),
				wasm.ref.as_non_null(wasm.tuple.extract(result.get(), 0)),
				wasm.return(result.get()),
			),
		], reftype.Value);
	}

	@memoizePerCode
	public override visitUnop(val: Unop): binaryen.ExpressionRef /* (ref $Value) */ {
		const {op, Vect, Value: VmValue, List, Dict, Map: VmMap} = this.cg.vm;
		const code: binaryen.ExpressionRef = this.visit(val.operand);
		switch (val.operator) {
			case OpCode.BOOL_FROM:  { return op.not(op.not(code)); }
			case OpCode.INT_FROM:   { return op.toInt(code); }
			case OpCode.NAT_FROM:   { return op.toNat(code); }
			case OpCode.FLOAT_FROM: { return op.toFloat(code); }
			case OpCode.STR_FROM:   { return op.toStr(code); }

			case OpCode.NOT: { return op.not(code); }
			case OpCode.EMP: { return op.isEmpty(code); }
			case OpCode.NEG: { return op.negate(code); }

			case OpCode.LIST_COUNT: { return VmValue.fromNat(Vect.newNat(this.wasm.i64.extend_i32_u(List .count(VmValue.asList(code))))); }
			case OpCode.DICT_COUNT: { return VmValue.fromNat(Vect.newNat(this.wasm.i64.extend_i32_u(Dict .count(VmValue.asDict(code))))); }
			case OpCode.SET_COUNT:  { return VmValue.fromNat(Vect.newNat(this.wasm.i64.extend_i32_u(VmMap.count(VmValue.asMap (code))))); }
			case OpCode.MAP_COUNT:  { return VmValue.fromNat(Vect.newNat(this.wasm.i64.extend_i32_u(VmMap.count(VmValue.asMap (code))))); }

			case OpCode.NONE_IS:        { return op.isNone(code); }
			case OpCode.FAIL_IS:        { return op.isFail(code); }
			case OpCode.MAYBE_UNWRAP:   { return op.unwrapMaybe(code); }
			case OpCode.RESULT_UNWRAP:  { return op.unwrapResult(code); }
			case OpCode.RESULT_EXTRACT: { return op.extractResult(code); }
		}
	}

	@memoizePerCode
	public override visitBinop(val: Binop): binaryen.ExpressionRef /* (ref $Value) */ {
		const {op} = this.cg.vm;
		const [code0, code1]: [binaryen.ExpressionRef /* (ref $Value) */, binaryen.ExpressionRef /* (ref $Value) */] = [this.visit(val.operand0), this.visit(val.operand1)];
		switch (val.operator) {
			case OpCode.INT_ADD: { return op.intAdd(code0, code1); }
			case OpCode.INT_SUB: { return op.intSub(code0, code1); }
			case OpCode.INT_MUL: { return op.intMul(code0, code1); }
			case OpCode.INT_DIV: { return op.intDiv(code0, code1); }
			case OpCode.INT_EXP: { return op.intExp(code0, code1); }

			case OpCode.NAT_ADD: { return op.natAdd(code0, code1); }
			case OpCode.NAT_SUB: { return op.natSub(code0, code1); }
			case OpCode.NAT_MUL: { return op.natMul(code0, code1); }
			case OpCode.NAT_DIV: { return op.natDiv(code0, code1); }
			case OpCode.NAT_EXP: { return op.natExp(code0, code1); }

			case OpCode.FLOAT_ADD: { return op.floatAdd(code0, code1); }
			case OpCode.FLOAT_SUB: { return op.floatSub(code0, code1); }
			case OpCode.FLOAT_MUL: { return op.floatMul(code0, code1); }
			case OpCode.FLOAT_DIV: { return op.floatDiv(code0, code1); }
			case OpCode.FLOAT_EXP: { return op.floatExp(code0, code1); }

			case OpCode.LT: { return op.lt(code0, code1); }
			case OpCode.GT: { return op.gt(code0, code1); }
			case OpCode.LE: { return op.le(code0, code1); }
			case OpCode.GE: { return op.ge(code0, code1); }

			case OpCode.ID: { return op.id(code0, code1); }
			case OpCode.EQ: { return op.eq(code0, code1); }
			case OpCode.IS: { return op.is(code0, code1); }
		}
	}

	@memoizePerCode
	public override visitFunction(val: OpFunction): binaryen.ExpressionRef /* (ref $Value) */ {
		return this.cg.codegenFunction(val.tempName, val.type.maxArity, val.builder);
	}

	public override defaultVisit(val: Value): binaryen.ExpressionRef /* (ref $Value) */ {
		throw new Error(`\`${val}\` could not be interpreted.`);
	}
}
