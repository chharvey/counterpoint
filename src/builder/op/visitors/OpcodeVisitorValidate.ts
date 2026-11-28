import * as assert from 'node:assert';
import * as xjs from 'extrajs';
import {
	type ConstructorType,
	assert_instanceof,
} from '../../../lib/index.ts';
import {TYPE} from '../../../typer/index.ts';
import {BuilderSymbolStatus, type Builder} from '../../Builder.ts';
import {TypeName} from '../utils-public.ts';
import {
	OpCode,
	OpcodeVisitor,
	type Opcode,
} from '../Opcode.ts';
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
import type {Drop} from '../Drop.ts';
import type {Decl} from '../Decl.ts';
import type {Set as OpSet} from '../Set.ts';
import type {CollectionDynamicSet} from '../CollectionDynamicSet.ts';
import type {CollectionDynamicCopy} from '../CollectionDynamicCopy.ts';
import type {Return} from '../Return.ts';
import type {GotoConditional} from '../GotoConditional.ts';
import {runOncePerCode} from './decorators.ts';



/** Type-validate the Opcode. Throws if invalid. */
export class OpcodeVisitorValidate extends OpcodeVisitor<void> {
	public constructor(private readonly builder: Builder) {
		super();
	}


	@runOncePerCode
	public override visitConst(val: Const): void {
		return assert.ok(val.interpreterValue.toType().isSubtypeOf(val.type));
	}

	@runOncePerCode
	public override visitGet(val: Get): void {
		if (this.builder.getSymbolStatus(val.target) !== BuilderSymbolStatus.SET) {
			throw new ReferenceError(`Invalid IR: Symbol \`${val.targetName}\` must be set before getting.`);
		}
	}

	@runOncePerCode
	public override visitTemplate(val: Template): void {
		return xjs.Array.forEachAggregated(val.items, (item) => this.visit(item));
	}

	@runOncePerCode
	public override visitCollectionLinearNew(val: CollectionLinearNew): void {
		assert_instanceof(val.type, new Map<TypeName, ConstructorType<TYPE.Type>>([
			[TypeName.TUPLE, TYPE.Tuple],
			[TypeName.LIST,  TYPE.List],
			[TypeName.SET,   TYPE.Set],
		]).get(val.name)!);
		return xjs.Array.forEachAggregated(val.items, (item) => this.visit(item));
	}

	@runOncePerCode
	public override visitRecordNew(val: RecordNew): void {
		assert_instanceof(val.type, TYPE.Record);
		return xjs.Map.forEachAggregated(val.props, ({value}) => this.visit(value));
	}

	@runOncePerCode
	public override visitDictNew(val: DictNew): void {
		assert_instanceof(val.type, TYPE.Dict);
		return xjs.Map.forEachAggregated(val.props, (value) => this.visit(value));
	}

	@runOncePerCode
	public override visitMapNew(val: MapNew): void {
		assert_instanceof(val.type, TYPE.Map);
		return xjs.Map.forEachAggregated(val.cases, (con, ant) => xjs.Array.forEachAggregated([ant, con], (value) => this.visit(value)));
	}

	@runOncePerCode
	public override visitObjectNew(val: ObjectNew): void {
		assert.ok(!!val.class_ || val.isClass);
		assert.ok(val.class_?.type.isSubtypeOf(TYPE.CLASS) ?? true);
		return val.class_ && this.visit(val.class_);
	}

	@runOncePerCode
	public override visitExcpNew(val: ExcpNew): void {
		assert.ok(val.message.type.isSubtypeOf(TYPE.STR));
		this.visit(val.message);
		return val.cause && this.visit(val.cause);
	}

	@runOncePerCode
	public override visitMaybeNew(val: MaybeNew): void {
		assert_instanceof(val.type, TYPE.Maybe);
		return val.value && this.visit(val.value);
	}

	@runOncePerCode
	public override visitResultNew(val: ResultNew): void {
		assert_instanceof(val.type, TYPE.Result);
		if (!val.isOk) {
			assert.ok(val.argument.type.isSubtypeOf(TYPE.EXCP));
		}
		return this.visit(val.argument);
	}

	@runOncePerCode
	public override visitTupleHas(val: TupleHas): void {
		this.visit(val.tuple);
		return assert_instanceof(val.tuple.type, TYPE.Tuple);
	}

	@runOncePerCode
	public override visitRecordHas(val: RecordHas): void {
		this.visit(val.record);
		return assert_instanceof(val.record.type, TYPE.Record);
	}

	@runOncePerCode
	public override visitTupleGet(val: TupleGet): void {
		this.visit(val.tuple);
		return assert_instanceof(val.tuple.type, TYPE.Tuple);
	}

	@runOncePerCode
	public override visitRecordGet(val: RecordGet): void {
		this.visit(val.record);
		return assert_instanceof(val.record.type, TYPE.Record);
	}

	@runOncePerCode
	public override visitCollectionDynamicGet(val: CollectionDynamicGet): void {
		xjs.Array.forEachAggregated([val.collection, val.accessor], (value) => this.visit(value));
		switch (val.name) {
			case TypeName.LIST: {
				assert_instanceof(val.collection.type, TYPE.List);
				return assert.ok(val.accessor.type.isSubtypeOf(TYPE.INT.union(TYPE.NAT)));
			}
			case TypeName.DICT: {
				assert_instanceof(val.collection.type, TYPE.Dict);
				return assert.ok(val.accessor.type.isSubtypeOf(TYPE.SYM.union(TYPE.STR)));
			}
			case TypeName.SET: {
				assert_instanceof(val.collection.type, TYPE.Set);
				return; // TODO: Set type generics
			}
			case TypeName.MAP: {
				assert_instanceof(val.collection.type, TYPE.Map);
				return; // TODO: Map type generics
			}
		}
	}

	@runOncePerCode
	public override visitCall(val: Call): void {
		return xjs.Array.forEachAggregated([val.callable, ...val.args], (value) => this.visit(value));
	}

	@runOncePerCode
	public override visitUnop(val: Unop): void {
		this.visit(val.operand);
		switch (val.operator) {
			case OpCode.INT_FROM:
			case OpCode.NAT_FROM:
			case OpCode.FLOAT_FROM:
			case OpCode.NEG: { return assert.ok(val.operand.type.isSubtypeOf(TYPE.NUMBER)); }

			case OpCode.LIST_COUNT: {
				assert_instanceof(val.operand.type, TYPE.List);
				return assert.ok(val.type.isSubtypeOf(TYPE.NAT));
			}
			case OpCode.DICT_COUNT: {
				assert_instanceof(val.operand.type, TYPE.Dict);
				return assert.ok(val.type.isSubtypeOf(TYPE.NAT));
			}
			case OpCode.SET_COUNT: {
				assert_instanceof(val.operand.type, TYPE.Set);
				return assert.ok(val.type.isSubtypeOf(TYPE.NAT));
			}
			case OpCode.MAP_COUNT: {
				assert_instanceof(val.operand.type, TYPE.Map);
				return assert.ok(val.type.isSubtypeOf(TYPE.NAT));
			}

			case OpCode.MAYBE_UNWRAP: {
				assert_instanceof(val.operand.type, TYPE.Maybe);
				return assert.ok(val.type.isSubtypeOf(val.operand.type.typearg));
			}
			case OpCode.RESULT_UNWRAP: {
				assert_instanceof(val.operand.type, TYPE.Result);
				return assert.ok(val.type.isSubtypeOf(val.operand.type.typeargSuccess));
			}
			case OpCode.RESULT_EXTRACT: {
				assert_instanceof(val.operand.type, TYPE.Result);
				return assert.ok(val.type.isSubtypeOf(val.operand.type.typeargFailure));
			}
		}
	}

	@runOncePerCode
	public override visitBinop(val: Binop): void {
		const operands = [val.operand0, val.operand1] as const;
		xjs.Array.forEachAggregated(operands, (arg) => {
			this.visit(arg);
			switch (val.operator) {
				case OpCode.INT_ADD: { return assert.ok(arg.type.isSubtypeOf(TYPE.INT)); }
				case OpCode.INT_SUB: { return assert.ok(arg.type.isSubtypeOf(TYPE.INT)); }
				case OpCode.INT_MUL: { return assert.ok(arg.type.isSubtypeOf(TYPE.INT)); }
				case OpCode.INT_DIV: { return assert.ok(arg.type.isSubtypeOf(TYPE.INT)); }
				case OpCode.INT_EXP: { return assert.ok(arg.type.isSubtypeOf(TYPE.INT)); }

				case OpCode.NAT_ADD: { return assert.ok(arg.type.isSubtypeOf(TYPE.NAT)); }
				case OpCode.NAT_SUB: { return assert.ok(arg.type.isSubtypeOf(TYPE.NAT)); }
				case OpCode.NAT_MUL: { return assert.ok(arg.type.isSubtypeOf(TYPE.NAT)); }
				case OpCode.NAT_DIV: { return assert.ok(arg.type.isSubtypeOf(TYPE.NAT)); }
				case OpCode.NAT_EXP: { return assert.ok(arg.type.isSubtypeOf(TYPE.NAT)); }

				case OpCode.FLOAT_ADD: { return assert.ok(arg.type.isSubtypeOf(TYPE.FLOAT)); }
				case OpCode.FLOAT_SUB: { return assert.ok(arg.type.isSubtypeOf(TYPE.FLOAT)); }
				case OpCode.FLOAT_MUL: { return assert.ok(arg.type.isSubtypeOf(TYPE.FLOAT)); }
				case OpCode.FLOAT_DIV: { return assert.ok(arg.type.isSubtypeOf(TYPE.FLOAT)); }
				case OpCode.FLOAT_EXP: { return assert.ok(arg.type.isSubtypeOf(TYPE.FLOAT)); }

				case OpCode.LT: { return assert.ok(arg.type.isSubtypeOf(TYPE.NUMBER)); }
				case OpCode.GT: { return assert.ok(arg.type.isSubtypeOf(TYPE.NUMBER)); }
				case OpCode.LE: { return assert.ok(arg.type.isSubtypeOf(TYPE.NUMBER)); }
				case OpCode.GE: { return assert.ok(arg.type.isSubtypeOf(TYPE.NUMBER)); }
			}
		});
		if (val.operator === OpCode.IS) {
			assert.ok(val.operand1.type.isSubtypeOf(TYPE.CLASS));
		}
	}

	@runOncePerCode
	public override visitDrop(instr: Drop): void {
		return this.visit(instr.value);
	}

	@runOncePerCode
	public override visitDecl(instr: Decl): void {
		// Use `DECLARED` only for declared, unset temps. Enforces setting before getting.
		// Uninitialized variables and parameters can use `SET` becuase they always have a `Maybe` value.
		if (this.builder.getSymbolStatus(instr.target) === undefined) {
			this.builder.setSymbolStatus(instr.target, BuilderSymbolStatus.DECLARED);
		}
	}

	@runOncePerCode
	public override visitSet(instr: OpSet): void {
		if (this.builder.getSymbolStatus(instr.target) === undefined) {
			throw new ReferenceError(`Invalid IR: Symbol \`${instr.targetName}\` must be declared before setting.`);
		}
		this.builder.setSymbolStatus(instr.target, BuilderSymbolStatus.SET);
		this.visit(instr.value);
		return assert.ok(instr.value.type.isSubtypeOf(instr.targetType), `${instr.value.type} must be a subtype of ${instr.targetType}.`);
	}

	@runOncePerCode
	public override visitCollectionDynamicSet(instr: CollectionDynamicSet): void {
		xjs.Array.forEachAggregated([instr.collection, instr.accessor, instr.value], (value) => this.visit(value));
		switch (instr.name) {
			case TypeName.LIST: {
				assert_instanceof(instr.collection.type, TYPE.List);
				return assert.ok(instr.accessor.type.isSubtypeOf(TYPE.INT.union(TYPE.NAT)));
			}
			case TypeName.DICT: {
				assert_instanceof(instr.collection.type, TYPE.Dict);
				return assert.ok(instr.accessor.type.isSubtypeOf(TYPE.SYM.union(TYPE.STR)));
			}
			case TypeName.SET: {
				assert_instanceof(instr.collection.type, TYPE.Set);
				return; // TODO: Set type generics
			}
			case TypeName.MAP: {
				assert_instanceof(instr.collection.type, TYPE.Map);
				return; // TODO: Map type generics
			}
		}
	}

	@runOncePerCode
	public override visitCollectionDynamicCopy(instr: CollectionDynamicCopy): void {
		xjs.Array.forEachAggregated([instr.destination, instr.source], (value) => this.visit(value));
		switch (instr.name) {
			case TypeName.LIST: {
				assert_instanceof(instr.destination.type, TYPE.List);
				return assert.ok([TYPE.Tuple, TYPE.List, TYPE.Set].some((typ) => instr.source.type instanceof typ));
			}
			case TypeName.DICT: {
				assert_instanceof(instr.destination.type, TYPE.Dict);
				return assert.ok([TYPE.Tuple, TYPE.Record, TYPE.List, TYPE.Dict, TYPE.Set, TYPE.Map].some((typ) => instr.source.type instanceof typ));
			}
			case TypeName.SET: {
				assert_instanceof(instr.destination.type, TYPE.Set);
				return assert.ok([TYPE.Tuple, TYPE.List, TYPE.Set].some((typ) => instr.source.type instanceof typ));
			}
			case TypeName.MAP: {
				assert_instanceof(instr.destination.type, TYPE.Map);
				return assert.ok([TYPE.Tuple, TYPE.List, TYPE.Set, TYPE.Map].some((typ) => instr.source.type instanceof typ));
			}
		}
	}

	public override visitReturn(instr: Return): void {
		instr.value && this.visit(instr.value);
		if (!instr.isReturn) {
			assert.ok(instr.value!.type.isSubtypeOf(TYPE.EXCP));
		}
	}

	public override visitGotoConditional(term: GotoConditional): void {
		this.visit(term.condition);
		return assert.ok(term.condition.type.isSubtypeOf(TYPE.BOOL));
	}

	public override defaultVisit(_op: Opcode): void {
		return;
	}
}
