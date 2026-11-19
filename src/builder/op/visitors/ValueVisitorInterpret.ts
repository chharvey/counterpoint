import * as assert from 'node:assert';
import {ErrorCode} from '../../../index.ts';
import {assert_instanceof} from '../../../lib/index.ts';
import {
	VALUE,
	TYPE,
	CLASS_CLASS,
} from '../../../typer/index.ts';
import {
	CoreLibName,
	CORE_LIB_NAMES,
} from '../../../parser/index.ts';
import {SymbolSchemaClass} from '../../../validator/index.ts';
import type {Interpreter} from '../../Interpreter.ts';
import {TypeName} from '../utils-public.ts';
import {OpCode} from '../Opcode.ts';
import {
	ValueVisitor,
	type Value,
} from '../Value.ts';
import type {Trap} from '../Trap.ts';
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



/** Execute the interpreter. */
export class ValueVisitorInterpret extends ValueVisitor<VALUE.Value> {
	public constructor(private readonly interp: Interpreter) {
		super();
	}


	public override visitTrap(_val: Trap): VALUE.Value {
		throw new ErrorCode('Trap.');
	}

	public override visitConst(val: Const): VALUE.Value {
		return val.interpreterValue;
	}

	public override visitGet(val: Get): VALUE.Value {
		if (
			val.target instanceof SymbolSchemaClass &&
			CORE_LIB_NAMES.includes(val.target.source as CoreLibName)
		) {
			let native_class: VALUE.Class['nativeClass'];
			switch (val.target.source as CoreLibName) {
				case CoreLibName.NULL:      { native_class = VALUE.Null;      break; }
				case CoreLibName.BOOLEAN:   { native_class = VALUE.Boolean;   break; }
				case CoreLibName.SYMBOL:    { native_class = VALUE.Symbol;    break; }
				case CoreLibName.INTEGER:   { native_class = VALUE.Integer;   break; }
				case CoreLibName.NATURAL:   { native_class = VALUE.Natural;   break; }
				case CoreLibName.FLOAT:     { native_class = VALUE.Float;     break; }
				case CoreLibName.STRING:    { native_class = VALUE.String;    break; }
				case CoreLibName.OBJECT:    { native_class = VALUE.Object;    break; }
				case CoreLibName.LIST:      { native_class = VALUE.List;      break; }
				case CoreLibName.DICT:      { native_class = VALUE.Dict;      break; }
				case CoreLibName.SET:       { native_class = VALUE.Set;       break; }
				case CoreLibName.MAP:       { native_class = VALUE.Map;       break; }
				case CoreLibName.EXCEPTION: { native_class = VALUE.Exception; break; }
				case CoreLibName.MAYBE:     { native_class = VALUE.Maybe;     break; }
				case CoreLibName.NONE:      { native_class = VALUE.None;      break; }
				case CoreLibName.SOME:      { native_class = VALUE.Some;      break; }
				case CoreLibName.RESULT:    { native_class = VALUE.Result;    break; }
				case CoreLibName.FAIL:      { native_class = VALUE.Fail;      break; }
				case CoreLibName.OK:        { native_class = VALUE.Ok;        break; }
				case CoreLibName.FUNCTION:  { native_class = VALUE.Function;  break; }
				case CoreLibName.CLASS:     { native_class = VALUE.Class;     break; }
			}
			return new VALUE.Class(val.target.classSignature.instanceType, native_class);
		} else {
			return this.interp.getLocalValue(val.target) ?? assert.fail(new ReferenceError(`Local variable \`${val.targetName}\` must be set first!`));
		}
	}

	public override visitTemplate(val: Template): VALUE.Value {
		return val.items.map((value) => this.visit(value).toCplString()).reduce((a, b) => a.concatenate(b));
	}

	public override visitCollectionLinearNew(val: CollectionLinearNew): VALUE.Value {
		const items: readonly VALUE.Value[] = val.items.map((value) => this.visit(value));
		switch (val.name) {
			case TypeName.TUPLE: { return new VALUE.Tuple(items); }
			case TypeName.LIST:  { return new VALUE.List(items); }
			case TypeName.SET:   { return new VALUE.Set(new Set<VALUE.Value>(items)); }
		}
	}

	public override visitRecordNew(val: RecordNew): VALUE.Value {
		return new VALUE.Record(new Map<bigint, VALUE.Value>([...val.props].map(([id, value]) => [
			id,
			this.visit(value),
		])));
	}

	public override visitDictNew(val: DictNew): VALUE.Value {
		return new VALUE.Dict(new Map<bigint, VALUE.Value>([...val.props].map(([{id}, value]) => [
			id,
			this.visit(value),
		])));
	}

	public override visitMapNew(val: MapNew): VALUE.Value {
		return new VALUE.Map(new Map<VALUE.Value, VALUE.Value>([...val.cases].map(([ant, con]) => [
			this.visit(ant),
			this.visit(con),
		])));
	}

	public override visitObjectNew(val: ObjectNew): VALUE.Value {
		const class_: VALUE.Value | undefined = val.class_ && this.visit(val.class_);
		if (class_) {
			assert_instanceof(class_, VALUE.Class);
			// @ts-expect-error --- deprecated usage
			return val.isClass ? new VALUE.Class(TYPE.OBJ, class_) : new VALUE.Object(0n, class_);
		} else {
			return CLASS_CLASS;
		}
	}

	public override visitExcpNew(val: ExcpNew): VALUE.Value {
		const message: VALUE.Value             = this.visit(val.message);
		const cause:   VALUE.Value | undefined = val.cause && this.visit(val.cause);
		assert_instanceof(message, VALUE.String);
		if (cause) {
			assert_instanceof(cause, VALUE.Exception);
			return new VALUE.Exception(message, cause);
		} else {
			return new VALUE.Exception(message);
		}
	}

	public override visitMaybeNew(val: MaybeNew): VALUE.Value {
		return val.value
			? new VALUE.Some(this.visit(val.value))
			: new VALUE.None((val.type as TYPE.Maybe).typearg);
	}

	public override visitResultNew(val: ResultNew): VALUE.Value {
		const argument: VALUE.Value = this.visit(val.argument);
		const {typeargFailure, typeargSuccess} = val.type as TYPE.Result;
		return val.isOk ? new VALUE.Ok(argument, typeargFailure) : new VALUE.Fail(typeargSuccess, argument as VALUE.Exception);
	}

	public override visitTupleHas(val: TupleHas): VALUE.Value {
		const base: VALUE.Value = this.visit(val.tuple);
		assert_instanceof(base, VALUE.Tuple);
		return VALUE.Boolean.fromBoolean(base.has(val.accessor));
	}

	public override visitRecordHas(val: RecordHas): VALUE.Value {
		const base: VALUE.Value = this.visit(val.record);
		assert_instanceof(base, VALUE.Record);
		return VALUE.Boolean.fromBoolean(base.has(val.accessor));
	}

	public override visitTupleGet(val: TupleGet): VALUE.Value {
		const base: VALUE.Value = this.visit(val.tuple);
		assert_instanceof(base, VALUE.Tuple);
		return base.get(val.accessor);
	}

	public override visitRecordGet(val: RecordGet): VALUE.Value {
		const base: VALUE.Value = this.visit(val.record);
		assert_instanceof(base, VALUE.Record);
		return base.get(val.accessor);
	}

	public override visitCollectionDynamicGet(val: CollectionDynamicGet): VALUE.Value {
		const base:     VALUE.Value = this.visit(val.collection);
		const accessor: VALUE.Value = this.visit(val.accessor);
		switch (val.name) {
			case TypeName.LIST: {
				assert_instanceof(base, VALUE.List);
				try {
					assert_instanceof(accessor, VALUE.Integer);
				} catch {
					assert_instanceof(accessor, VALUE.Natural);
				}
				return base.get(accessor.toBigInt());
			}
			case TypeName.DICT: {
				assert_instanceof(base, VALUE.Dict);
				try {
					assert_instanceof(accessor, VALUE.Symbol);
				} catch {
					assert_instanceof(accessor, VALUE.String);
					throw new Error('String keys for dict access are not yet supported.');
				}
				return base.get(accessor.id);
			}
			case TypeName.SET: {
				assert_instanceof(base, VALUE.Set);
				return base.get(accessor);
			}
			case TypeName.MAP: {
				assert_instanceof(base, VALUE.Map);
				return base.get(accessor);
			}
		}
	}

	public override visitCall(val: Call): VALUE.Value {
		val;
		throw new Error('`ValueVisitorInterpret#visitCall` is not yet supported.');
	}

	public override visitUnop(val: Unop): VALUE.Value {
		const operand: VALUE.Value = this.visit(val.operand);
		switch (val.operator) {
			case OpCode.BOOL_FROM:  { return VALUE.Boolean.fromBoolean(operand.isTruthy); }
			case OpCode.INT_FROM:   { return (operand as VALUE.Number).toInt(); }
			case OpCode.NAT_FROM:   { return (operand as VALUE.Number).toNat(); }
			case OpCode.FLOAT_FROM: { return (operand as VALUE.Number).toFloat(); }
			case OpCode.STR_FROM:   { return operand.toCplString(); }

			case OpCode.NOT: { return VALUE.Boolean.fromBoolean(!operand.isTruthy); }
			case OpCode.EMP: { return VALUE.Boolean.fromBoolean(operand.isEmpty); }
			case OpCode.NEG: { return (operand as VALUE.Integer | VALUE.Float).neg(); }

			case OpCode.LIST_COUNT: { return new VALUE.Natural((operand as VALUE.List).count); }
			case OpCode.DICT_COUNT: { return new VALUE.Natural((operand as VALUE.Dict).count); }
			case OpCode.SET_COUNT:  { return new VALUE.Natural((operand as VALUE.Set).count); }
			case OpCode.MAP_COUNT:  { return new VALUE.Natural((operand as VALUE.Map).count); }

			case OpCode.NONE_IS:        { return VALUE.Boolean.fromBoolean(operand instanceof VALUE.None); }
			case OpCode.FAIL_IS:        { return VALUE.Boolean.fromBoolean(operand instanceof VALUE.Fail); }
			case OpCode.MAYBE_UNWRAP:   { return operand instanceof VALUE.Some ? operand.value  : assert.fail(new TypeError('Unwrapped a None value.')); }
			case OpCode.RESULT_UNWRAP:  { return operand instanceof VALUE.Ok   ? operand.value  : assert.fail(new TypeError('Unwrapped a Fail value.')); }
			case OpCode.RESULT_EXTRACT: { return operand instanceof VALUE.Fail ? operand.reason : assert.fail(new TypeError('Extracted from an Ok value.')); }
		}
	}

	public override visitBinop(val: Binop): VALUE.Value {
		const [operand0, operand1]: [VALUE.Value, VALUE.Value] = [this.visit(val.operand0), this.visit(val.operand1)];
		switch (val.operator) {
			case OpCode.INT_ADD: { return (operand0 as VALUE.Integer).plus   (operand1 as VALUE.Integer); }
			case OpCode.INT_SUB: { return (operand0 as VALUE.Integer).minus  (operand1 as VALUE.Integer); }
			case OpCode.INT_MUL: { return (operand0 as VALUE.Integer).times  (operand1 as VALUE.Integer); }
			case OpCode.INT_DIV: { return (operand0 as VALUE.Integer).divide (operand1 as VALUE.Integer); }
			case OpCode.INT_EXP: { return (operand0 as VALUE.Integer).exp    (operand1 as VALUE.Integer); }

			case OpCode.NAT_ADD: { return (operand0 as VALUE.Natural).plus   (operand1 as VALUE.Natural); }
			case OpCode.NAT_SUB: { return (operand0 as VALUE.Natural).minus  (operand1 as VALUE.Natural); }
			case OpCode.NAT_MUL: { return (operand0 as VALUE.Natural).times  (operand1 as VALUE.Natural); }
			case OpCode.NAT_DIV: { return (operand0 as VALUE.Natural).divide (operand1 as VALUE.Natural); }
			case OpCode.NAT_EXP: { return (operand0 as VALUE.Natural).exp    (operand1 as VALUE.Natural); }

			case OpCode.FLOAT_ADD: { return (operand0 as VALUE.Float).plus   (operand1 as VALUE.Float); }
			case OpCode.FLOAT_SUB: { return (operand0 as VALUE.Float).minus  (operand1 as VALUE.Float); }
			case OpCode.FLOAT_MUL: { return (operand0 as VALUE.Float).times  (operand1 as VALUE.Float); }
			case OpCode.FLOAT_DIV: { return (operand0 as VALUE.Float).divide (operand1 as VALUE.Float); }
			case OpCode.FLOAT_EXP: { return (operand0 as VALUE.Float).exp    (operand1 as VALUE.Float); }

			case OpCode.LT: { return VALUE.Boolean.fromBoolean((operand0 as VALUE.Number).lt(operand1 as VALUE.Number)); }
			case OpCode.GT: { return VALUE.Boolean.fromBoolean((operand1 as VALUE.Number).lt(operand0 as VALUE.Number)); }
			case OpCode.LE: { return VALUE.Boolean.fromBoolean((operand0 as VALUE.Number).equal(operand1) || (operand0 as VALUE.Number).lt(operand1 as VALUE.Number)); }
			case OpCode.GE: { return VALUE.Boolean.fromBoolean((operand1 as VALUE.Number).equal(operand0) || (operand1 as VALUE.Number).lt(operand0 as VALUE.Number)); }

			case OpCode.ID: { return VALUE.Boolean.fromBoolean(operand0.identical(operand1)); }
			case OpCode.EQ: { return VALUE.Boolean.fromBoolean(operand0.equal(operand1)); }
			case OpCode.IS: {
				assert_instanceof(operand1, VALUE.Class);
				return VALUE.Boolean.fromBoolean(operand0 instanceof operand1.nativeClass);
			}
		}
	}

	public override visitFunction(val: OpFunction): VALUE.Value {
		return new VALUE.Function(val.type, val.source);
	}

	public override defaultVisit(val: Value): VALUE.Value {
		throw new Error(`\`${val}\` could not be interpreted.`);
	}
}
