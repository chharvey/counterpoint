import * as binaryen from 'binaryen.ts';
import type {VirtualMachine} from '../VirtualMachine.ts';
import type {FuncImportData} from '../classes/HasFuncData.ts';



/** Language-level operators. */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function ops(vm: VirtualMachine) {
	let func_import_memo: ReadonlyMap<string, FuncImportData> | null = null;

	return {
		get funcImportDataMap(): ReadonlyMap<string, FuncImportData> {
			if (!func_import_memo) {
				const {reftype} = vm;
				const binary_params: binaryen.Type = binaryen.createType([reftype.Value, reftype.Value]);
				func_import_memo = new Map<string, FuncImportData>([
					['op::toInt',       {name: 'op:to-int',       param: reftype.Value,  result: reftype.Value}],
					['op::toNat',       {name: 'op:to-nat',       param: reftype.Value,  result: reftype.Value}],
					['op::toFloat',     {name: 'op:to-float',     param: reftype.Value,  result: reftype.Value}],
					['op::not',         {name: 'op:not',          param: reftype.Value,  result: reftype.Value}],
					['op::isEmpty',     {name: 'op:is-empty',     param: reftype.Value,  result: reftype.Value}],
					['op::negate',      {name: 'op:negate',       param: reftype.Value,  result: reftype.Value}],
					['op::unwrapMaybe', {name: 'op:unwrap-maybe', param: reftype.Value,  result: reftype.Value}],
					['op::isInt',       {name: 'op:is-int',       param: reftype.Value,  result: reftype.Value}],
					['op::isNat',       {name: 'op:is-nat',       param: reftype.Value,  result: reftype.Value}],
					['op::isFloat',     {name: 'op:is-float',     param: reftype.Value,  result: reftype.Value}],
					['op::isString',    {name: 'op:is-string',    param: reftype.Value,  result: reftype.Value}],
					['op::isObject',    {name: 'op:is-object',    param: reftype.Value,  result: reftype.Value}],
					['op::isList',      {name: 'op:is-list',      param: reftype.Value,  result: reftype.Value}],
					['op::isDict',      {name: 'op:is-dict',      param: reftype.Value,  result: reftype.Value}],
					['op::isMap',       {name: 'op:is-map',       param: reftype.Value,  result: reftype.Value}],
					['op::isMaybe',     {name: 'op:is-maybe',     param: reftype.Value,  result: reftype.Value}],
					['op::isNone',      {name: 'op:is-none',      param: reftype.Value,  result: reftype.Value}],
					['op::isSome',      {name: 'op:is-some',      param: reftype.Value,  result: reftype.Value}],
					['op::asNull',      {name: 'op:as-null',      param: reftype.Value,  result: reftype.Value}],
					['op::asBool',      {name: 'op:as-bool',      param: reftype.Value,  result: reftype.Value}],
					['op::asInt',       {name: 'op:as-int',       param: reftype.Value,  result: reftype.Value}],
					['op::asNat',       {name: 'op:as-nat',       param: reftype.Value,  result: reftype.Value}],
					['op::asFloat',     {name: 'op:as-float',     param: reftype.Value,  result: reftype.Value}],
					['op::asString',    {name: 'op:as-string',    param: reftype.Value,  result: reftype.Value}],
					['op::asObject',    {name: 'op:as-object',    param: reftype.Value,  result: reftype.Value}],
					['op::asList',      {name: 'op:as-list',      param: reftype.Value,  result: reftype.Value}],
					['op::asDict',      {name: 'op:as-dict',      param: reftype.Value,  result: reftype.Value}],
					['op::asMap',       {name: 'op:as-map',       param: reftype.Value,  result: reftype.Value}],
					['op::asMaybe',     {name: 'op:as-maybe',     param: reftype.Value,  result: reftype.Value}],
					['op::asNone',      {name: 'op:as-none',      param: reftype.Value,  result: reftype.Value}],
					['op::asSome',      {name: 'op:as-some',      param: reftype.Value,  result: reftype.Value}],
					['op::intAdd',      {name: 'op:int-add',      param: binary_params,  result: reftype.Value}],
					['op::natAdd',      {name: 'op:nat-add',      param: binary_params,  result: reftype.Value}],
					['op::floatAdd',    {name: 'op:float-add',    param: binary_params,  result: reftype.Value}],
					['op::intSub',      {name: 'op:int-sub',      param: binary_params,  result: reftype.Value}],
					['op::natSub',      {name: 'op:nat-sub',      param: binary_params,  result: reftype.Value}],
					['op::floatSub',    {name: 'op:float-sub',    param: binary_params,  result: reftype.Value}],
					['op::intMul',      {name: 'op:int-mul',      param: binary_params,  result: reftype.Value}],
					['op::natMul',      {name: 'op:nat-mul',      param: binary_params,  result: reftype.Value}],
					['op::floatMul',    {name: 'op:float-mul',    param: binary_params,  result: reftype.Value}],
					['op::intDiv',      {name: 'op:int-div',      param: binary_params,  result: reftype.Value}],
					['op::natDiv',      {name: 'op:nat-div',      param: binary_params,  result: reftype.Value}],
					['op::floatDiv',    {name: 'op:float-div',    param: binary_params,  result: reftype.Value}],
					['op::intExp',      {name: 'op:int-exp',      param: binary_params,  result: reftype.Value}],
					['op::natExp',      {name: 'op:nat-exp',      param: binary_params,  result: reftype.Value}],
					['op::floatExp',    {name: 'op:float-exp',    param: binary_params,  result: reftype.Value}],
					['op::lt',          {name: 'op:lt',           param: binary_params,  result: reftype.Value}],
					['op::gt',          {name: 'op:gt',           param: binary_params,  result: reftype.Value}],
					['op::le',          {name: 'op:le',           param: binary_params,  result: reftype.Value}],
					['op::ge',          {name: 'op:ge',           param: binary_params,  result: reftype.Value}],
					['op::id',          {name: 'op:id',           param: binary_params,  result: reftype.Value}],
					['op::eq',          {name: 'op:eq',           param: binary_params,  result: reftype.Value}],
				]);
			}
			return func_import_memo;
		},


		/** Cast the argument to type `int`. */
		toInt: (param0: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* (ref $Value) */ => (
			vm.mod.wasm.call('op:to-int', [param0], vm.reftype.Value)
		),

		/** Cast the argument to type `nat`. */
		toNat: (param0: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* (ref $Value) */ => (
			vm.mod.wasm.call('op:to-nat', [param0], vm.reftype.Value)
		),

		/** Cast the argument to type `float`. */
		toFloat: (param0: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* (ref $Value) */ => (
			vm.mod.wasm.call('op:to-float', [param0], vm.reftype.Value)
		),

		/** Is the value falsy? */
		not: (param0: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* (ref $Value) */ => (
			vm.mod.wasm.call('op:not', [param0], vm.reftype.Value)
		),

		/** Is the value empty? */
		isEmpty: (param0: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* (ref $Value) */ => (
			vm.mod.wasm.call('op:is-empty', [param0], vm.reftype.Value)
		),

		/** Returns the mathematical negation. */
		negate: (param0: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* (ref $Value) */ => (
			vm.mod.wasm.call('op:negate', [param0], vm.reftype.Value)
		),

		/** Return the value of the given `Maybe` if it exists, else trap. */
		unwrapMaybe: (param0: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* (ref $Value) */ => (
			vm.mod.wasm.call('op:unwrap-maybe', [param0], vm.reftype.Value)
		),

		/** Is the value a primitive holding an int? */
		isInt: (param0: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* (ref $Value) */ => (
			vm.mod.wasm.call('op:is-int', [param0], vm.reftype.Value)
		),

		/** Is the value a primitive holding a nat? */
		isNat: (param0: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* (ref $Value) */ => (
			vm.mod.wasm.call('op:is-nat', [param0], vm.reftype.Value)
		),

		/** Is the value a primitive holding a float? */
		isFloat: (param0: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* (ref $Value) */ => (
			vm.mod.wasm.call('op:is-float', [param0], vm.reftype.Value)
		),

		/** Is the value a composite `String` type? */
		isString: (param0: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* (ref $Value) */ => (
			vm.mod.wasm.call('op:is-string', [param0], vm.reftype.Value)
		),

		/** Is the value a composite `Object` type? */
		isObject: (param0: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* (ref $Value) */ => (
			vm.mod.wasm.call('op:is-object', [param0], vm.reftype.Value)
		),

		/** Is the value a composite `List` type? */
		isList: (param0: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* (ref $Value) */ => (
			vm.mod.wasm.call('op:is-list', [param0], vm.reftype.Value)
		),

		/** Is the value a composite `Dict` type? */
		isDict: (param0: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* (ref $Value) */ => (
			vm.mod.wasm.call('op:is-dict', [param0], vm.reftype.Value)
		),

		/** Is the value a composite `Map` type? */
		isMap: (param0: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* (ref $Value) */ => (
			vm.mod.wasm.call('op:is-map', [param0], vm.reftype.Value)
		),

		/** Is the value a composite `Maybe` type? */
		isMaybe: (param0: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* (ref $Value) */ => (
			vm.mod.wasm.call('op:is-maybe', [param0], vm.reftype.Value)
		),

		/** Is the value a composite `Maybe` type with a null value? */
		isNone: (param0: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* (ref $Value) */ => (
			vm.mod.wasm.call('op:is-none', [param0], vm.reftype.Value)
		),

		/** Is the value a composite `Maybe` type with a non-null value? */
		isSome: (param0: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* (ref $Value) */ => (
			vm.mod.wasm.call('op:is-some', [param0], vm.reftype.Value)
		),

		/** Cast the value to type `null`. */
		asNull: (param0: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* (ref $Value) */ => (
			vm.mod.wasm.call('op:as-null', [param0], vm.reftype.Value)
		),

		/** Cast the value to type `bool`. */
		asBool: (param0: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* (ref $Value) */ => (
			vm.mod.wasm.call('op:as-bool', [param0], vm.reftype.Value)
		),

		/** Cast the value to type `int`. */
		asInt: (param0: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* (ref $Value) */ => (
			vm.mod.wasm.call('op:as-int', [param0], vm.reftype.Value)
		),

		/** Cast the value to type `nat`. */
		asNat: (param0: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* (ref $Value) */ => (
			vm.mod.wasm.call('op:as-nat', [param0], vm.reftype.Value)
		),

		/** Cast the value to type `float`. */
		asFloat: (param0: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* (ref $Value) */ => (
			vm.mod.wasm.call('op:as-float', [param0], vm.reftype.Value)
		),

		/** Cast the value to type `String`. */
		asString: (param0: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* (ref $Value) */ => (
			vm.mod.wasm.call('op:as-string', [param0], vm.reftype.Value)
		),

		/** Cast the value to type `Object`. */
		asObject: (param0: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* (ref $Value) */ => (
			vm.mod.wasm.call('op:as-object', [param0], vm.reftype.Value)
		),

		/** Cast the value to type `List`. */
		asList: (param0: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* (ref $Value) */ => (
			vm.mod.wasm.call('op:as-list', [param0], vm.reftype.Value)
		),

		/** Cast the value to type `Dict`. */
		asDict: (param0: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* (ref $Value) */ => (
			vm.mod.wasm.call('op:as-dict', [param0], vm.reftype.Value)
		),

		/** Cast the value to type `Map`. */
		asMap: (param0: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* (ref $Value) */ => (
			vm.mod.wasm.call('op:as-map', [param0], vm.reftype.Value)
		),

		/** Cast the value to type `Maybe`. */
		asMaybe: (param0: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* (ref $Value) */ => (
			vm.mod.wasm.call('op:as-maybe', [param0], vm.reftype.Value)
		),

		/** Cast the value to type `None`. */
		asNone: (param0: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* (ref $Value) */ => (
			vm.mod.wasm.call('op:as-none', [param0], vm.reftype.Value)
		),

		/** Cast the value to type `Some`. */
		asSome: (param0: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* (ref $Value) */ => (
			vm.mod.wasm.call('op:as-some', [param0], vm.reftype.Value)
		),

		/** Adds two `int`s. */
		intAdd: (param0: binaryen.ExpressionRef /* (ref $Value) */, param1: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* (ref $Value) */ => (
			vm.mod.wasm.call('op:int-add', [param0, param1], vm.reftype.Value)
		),

		/** Adds two `nat`s. */
		natAdd: (param0: binaryen.ExpressionRef /* (ref $Value) */, param1: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* (ref $Value) */ => (
			vm.mod.wasm.call('op:nat-add', [param0, param1], vm.reftype.Value)
		),

		/** Adds two `float`s. */
		floatAdd: (param0: binaryen.ExpressionRef /* (ref $Value) */, param1: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* (ref $Value) */ => (
			vm.mod.wasm.call('op:float-add', [param0, param1], vm.reftype.Value)
		),

		/** Subtracts the second `int` argument from the first (`param0 - param1`). */
		intSub: (param0: binaryen.ExpressionRef /* (ref $Value) */, param1: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* (ref $Value) */ => (
			vm.mod.wasm.call('op:int-sub', [param0, param1], vm.reftype.Value)
		),

		/** Subtracts the second `nat` argument from the first (`param0 - param1`). */
		natSub: (param0: binaryen.ExpressionRef /* (ref $Value) */, param1: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* (ref $Value) */ => (
			vm.mod.wasm.call('op:nat-sub', [param0, param1], vm.reftype.Value)
		),

		/** Subtracts the second `float` argument from the first (`param0 - param1`). */
		floatSub: (param0: binaryen.ExpressionRef /* (ref $Value) */, param1: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* (ref $Value) */ => (
			vm.mod.wasm.call('op:float-sub', [param0, param1], vm.reftype.Value)
		),

		/** Multiplies two `int`s. */
		intMul: (param0: binaryen.ExpressionRef /* (ref $Value) */, param1: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* (ref $Value) */ => (
			vm.mod.wasm.call('op:int-mul', [param0, param1], vm.reftype.Value)
		),

		/** Multiplies two `nat`s. */
		natMul: (param0: binaryen.ExpressionRef /* (ref $Value) */, param1: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* (ref $Value) */ => (
			vm.mod.wasm.call('op:nat-mul', [param0, param1], vm.reftype.Value)
		),

		/** Multiplies two `float`s. */
		floatMul: (param0: binaryen.ExpressionRef /* (ref $Value) */, param1: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* (ref $Value) */ => (
			vm.mod.wasm.call('op:float-mul', [param0, param1], vm.reftype.Value)
		),

		/** Divides the first `int` argument by the second (`param0 / param1`). */
		intDiv: (param0: binaryen.ExpressionRef /* (ref $Value) */, param1: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* (ref $Value) */ => (
			vm.mod.wasm.call('op:int-div', [param0, param1], vm.reftype.Value)
		),

		/** Divides the first `nat` argument by the second (`param0 / param1`). */
		natDiv: (param0: binaryen.ExpressionRef /* (ref $Value) */, param1: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* (ref $Value) */ => (
			vm.mod.wasm.call('op:nat-div', [param0, param1], vm.reftype.Value)
		),

		/** Divides the first `float` argument by the second (`param0 / param1`). */
		floatDiv: (param0: binaryen.ExpressionRef /* (ref $Value) */, param1: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* (ref $Value) */ => (
			vm.mod.wasm.call('op:float-div', [param0, param1], vm.reftype.Value)
		),

		/** Exponentiates the first `int` argument by the second (`param0 ^ param1`). */
		intExp: (param0: binaryen.ExpressionRef /* (ref $Value) */, param1: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* (ref $Value) */ => (
			vm.mod.wasm.call('op:int-exp', [param0, param1], vm.reftype.Value)
		),

		/** Exponentiates the first `nat` argument by the second (`param0 ^ param1`). */
		natExp: (param0: binaryen.ExpressionRef /* (ref $Value) */, param1: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* (ref $Value) */ => (
			vm.mod.wasm.call('op:nat-exp', [param0, param1], vm.reftype.Value)
		),

		/** Exponentiates the first `float` argument by the second (`param0 ^ param1`). */
		floatExp: (param0: binaryen.ExpressionRef /* (ref $Value) */, param1: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* (ref $Value) */ => (
			vm.mod.wasm.call('op:float-exp', [param0, param1], vm.reftype.Value)
		),

		/** Is the first argument less than the second? */
		lt: (param0: binaryen.ExpressionRef /* (ref $Value) */, param1: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* (ref $Value) */ => (
			vm.mod.wasm.call('op:lt', [param0, param1], vm.reftype.Value)
		),

		/** Is the first argument greater than the second? */
		gt: (param0: binaryen.ExpressionRef /* (ref $Value) */, param1: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* (ref $Value) */ => (
			vm.mod.wasm.call('op:gt', [param0, param1], vm.reftype.Value)
		),

		/** Is the first argument less than or equal to the second? */
		le: (param0: binaryen.ExpressionRef /* (ref $Value) */, param1: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* (ref $Value) */ => (
			vm.mod.wasm.call('op:le', [param0, param1], vm.reftype.Value)
		),

		/** Is the first argument greater than or equal to the second? */
		ge: (param0: binaryen.ExpressionRef /* (ref $Value) */, param1: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* (ref $Value) */ => (
			vm.mod.wasm.call('op:ge', [param0, param1], vm.reftype.Value)
		),

		/** Are the arguments ‘identical’ per the Counterpoint definition? */
		id: (param0: binaryen.ExpressionRef /* (ref $Value) */, param1: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* (ref $Value) */ => (
			vm.mod.wasm.call('op:id', [param0, param1], vm.reftype.Value)
		),

		/** Are the arguments ‘equal’ per the Counterpoint definition? */
		eq: (param0: binaryen.ExpressionRef /* (ref $Value) */, param1: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* (ref $Value) */ => (
			vm.mod.wasm.call('op:eq', [param0, param1], vm.reftype.Value)
		),
	} as const;
}
