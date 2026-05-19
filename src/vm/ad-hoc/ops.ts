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
					['op::isNull',   {name: 'op:is-null',   param: reftype.Value,  result: reftype.Value}],
					['op::not',      {name: 'op:not',       param: reftype.Value,  result: reftype.Value}],
					['op::isEmpty',  {name: 'op:is-empty',  param: reftype.Value,  result: reftype.Value}],
					['op::negate',   {name: 'op:negate',    param: reftype.Value,  result: reftype.Value}],
					['op::toInt',    {name: 'op:to-int',    param: reftype.Value,  result: reftype.Value}],
					['op::toNat',    {name: 'op:to-nat',    param: reftype.Value,  result: reftype.Value}],
					['op::toFloat',  {name: 'op:to-float',  param: reftype.Value,  result: reftype.Value}],
					['op::intAdd',   {name: 'op:int-add',   param: binary_params,  result: reftype.Value}],
					['op::natAdd',   {name: 'op:nat-add',   param: binary_params,  result: reftype.Value}],
					['op::floatAdd', {name: 'op:float-add', param: binary_params,  result: reftype.Value}],
					['op::intSub',   {name: 'op:int-sub',   param: binary_params,  result: reftype.Value}],
					['op::natSub',   {name: 'op:nat-sub',   param: binary_params,  result: reftype.Value}],
					['op::floatSub', {name: 'op:float-sub', param: binary_params,  result: reftype.Value}],
					['op::intMul',   {name: 'op:int-mul',   param: binary_params,  result: reftype.Value}],
					['op::natMul',   {name: 'op:nat-mul',   param: binary_params,  result: reftype.Value}],
					['op::floatMul', {name: 'op:float-mul', param: binary_params,  result: reftype.Value}],
					['op::intDiv',   {name: 'op:int-div',   param: binary_params,  result: reftype.Value}],
					['op::natDiv',   {name: 'op:nat-div',   param: binary_params,  result: reftype.Value}],
					['op::floatDiv', {name: 'op:float-div', param: binary_params,  result: reftype.Value}],
					['op::intExp',   {name: 'op:int-exp',   param: binary_params,  result: reftype.Value}],
					['op::natExp',   {name: 'op:nat-exp',   param: binary_params,  result: reftype.Value}],
					['op::floatExp', {name: 'op:float-exp', param: binary_params,  result: reftype.Value}],
					['op::lt',       {name: 'op:lt',        param: binary_params,  result: reftype.Value}],
					['op::gt',       {name: 'op:gt',        param: binary_params,  result: reftype.Value}],
					['op::le',       {name: 'op:le',        param: binary_params,  result: reftype.Value}],
					['op::ge',       {name: 'op:ge',        param: binary_params,  result: reftype.Value}],
					['op::id',       {name: 'op:id',        param: binary_params,  result: reftype.Value}],
					['op::eq',       {name: 'op:eq',        param: binary_params,  result: reftype.Value}],
				]);
			}
			return func_import_memo;
		},


		/** Is the value equal to the counterpoint value `null`? */
		isNull: (param0: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* (ref $Value) */ => (
			vm.mod.wasm.call('op:is-null', [param0], vm.reftype.Value)
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
