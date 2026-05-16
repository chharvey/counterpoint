import type * as binaryen from 'binaryen.ts';
import type {VirtualMachine} from '../VirtualMachine.ts';



/** Language-level operators. */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function ops(vm: VirtualMachine) {
	return {
		/** Is the value equal to the counterpoint value `null`? */
		isNull: (param0: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* (ref $Value) */ => (
			vm.mod.call('op:is-null', [param0], vm.reftype.Value)
		),

		/** Is the value falsy? */
		not: (param0: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* (ref $Value) */ => (
			vm.mod.call('op:not', [param0], vm.reftype.Value)
		),

		/** Is the value empty? */
		isEmpty: (param0: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* (ref $Value) */ => (
			vm.mod.call('op:is-empty', [param0], vm.reftype.Value)
		),

		/** Returns the mathematical negation. */
		negate: (param0: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* (ref $Value) */ => (
			vm.mod.call('op:negate', [param0], vm.reftype.Value)
		),

		/** Cast the argument to type `int`. */
		toInt: (param0: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* (ref $Value) */ => (
			vm.mod.call('op:to-int', [param0], vm.reftype.Value)
		),

		/** Cast the argument to type `nat`. */
		toNat: (param0: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* (ref $Value) */ => (
			vm.mod.call('op:to-nat', [param0], vm.reftype.Value)
		),

		/** Cast the argument to type `float`. */
		toFloat: (param0: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* (ref $Value) */ => (
			vm.mod.call('op:to-float', [param0], vm.reftype.Value)
		),

		/** Adds two `int`s. */
		intAdd: (param0: binaryen.ExpressionRef /* (ref $Value) */, param1: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* (ref $Value) */ => (
			vm.mod.call('op:int-add', [param0, param1], vm.reftype.Value)
		),

		/** Adds two `nat`s. */
		natAdd: (param0: binaryen.ExpressionRef /* (ref $Value) */, param1: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* (ref $Value) */ => (
			vm.mod.call('op:nat-add', [param0, param1], vm.reftype.Value)
		),

		/** Adds two `float`s. */
		floatAdd: (param0: binaryen.ExpressionRef /* (ref $Value) */, param1: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* (ref $Value) */ => (
			vm.mod.call('op:float-add', [param0, param1], vm.reftype.Value)
		),

		/** Subtracts the second `int` argument from the first (`param0 - param1`). */
		intSub: (param0: binaryen.ExpressionRef /* (ref $Value) */, param1: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* (ref $Value) */ => (
			vm.mod.call('op:int-sub', [param0, param1], vm.reftype.Value)
		),

		/** Subtracts the second `nat` argument from the first (`param0 - param1`). */
		natSub: (param0: binaryen.ExpressionRef /* (ref $Value) */, param1: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* (ref $Value) */ => (
			vm.mod.call('op:nat-sub', [param0, param1], vm.reftype.Value)
		),

		/** Subtracts the second `float` argument from the first (`param0 - param1`). */
		floatSub: (param0: binaryen.ExpressionRef /* (ref $Value) */, param1: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* (ref $Value) */ => (
			vm.mod.call('op:float-sub', [param0, param1], vm.reftype.Value)
		),

		/** Multiplies two `int`s. */
		intMul: (param0: binaryen.ExpressionRef /* (ref $Value) */, param1: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* (ref $Value) */ => (
			vm.mod.call('op:int-mul', [param0, param1], vm.reftype.Value)
		),

		/** Multiplies two `nat`s. */
		natMul: (param0: binaryen.ExpressionRef /* (ref $Value) */, param1: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* (ref $Value) */ => (
			vm.mod.call('op:nat-mul', [param0, param1], vm.reftype.Value)
		),

		/** Multiplies two `float`s. */
		floatMul: (param0: binaryen.ExpressionRef /* (ref $Value) */, param1: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* (ref $Value) */ => (
			vm.mod.call('op:float-mul', [param0, param1], vm.reftype.Value)
		),

		/** Divides the first `int` argument by the second (`param0 / param1`). */
		intDiv: (param0: binaryen.ExpressionRef /* (ref $Value) */, param1: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* (ref $Value) */ => (
			vm.mod.call('op:int-div', [param0, param1], vm.reftype.Value)
		),

		/** Divides the first `nat` argument by the second (`param0 / param1`). */
		natDiv: (param0: binaryen.ExpressionRef /* (ref $Value) */, param1: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* (ref $Value) */ => (
			vm.mod.call('op:nat-div', [param0, param1], vm.reftype.Value)
		),

		/** Divides the first `float` argument by the second (`param0 / param1`). */
		floatDiv: (param0: binaryen.ExpressionRef /* (ref $Value) */, param1: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* (ref $Value) */ => (
			vm.mod.call('op:float-div', [param0, param1], vm.reftype.Value)
		),

		/** Exponentiates the first `int` argument by the second (`param0 ^ param1`). */
		intExp: (param0: binaryen.ExpressionRef /* (ref $Value) */, param1: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* (ref $Value) */ => (
			vm.mod.call('op:int-exp', [param0, param1], vm.reftype.Value)
		),

		/** Exponentiates the first `nat` argument by the second (`param0 ^ param1`). */
		natExp: (param0: binaryen.ExpressionRef /* (ref $Value) */, param1: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* (ref $Value) */ => (
			vm.mod.call('op:nat-exp', [param0, param1], vm.reftype.Value)
		),

		/** Exponentiates the first `float` argument by the second (`param0 ^ param1`). */
		floatExp: (param0: binaryen.ExpressionRef /* (ref $Value) */, param1: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* (ref $Value) */ => (
			vm.mod.call('op:float-exp', [param0, param1], vm.reftype.Value)
		),

		/** Is the first argument less than the second? */
		lt: (param0: binaryen.ExpressionRef /* (ref $Value) */, param1: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* (ref $Value) */ => (
			vm.mod.call('op:lt', [param0, param1], vm.reftype.Value)
		),

		/** Is the first argument greater than the second? */
		gt: (param0: binaryen.ExpressionRef /* (ref $Value) */, param1: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* (ref $Value) */ => (
			vm.mod.call('op:gt', [param0, param1], vm.reftype.Value)
		),

		/** Is the first argument less than or equal to the second? */
		le: (param0: binaryen.ExpressionRef /* (ref $Value) */, param1: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* (ref $Value) */ => (
			vm.mod.call('op:le', [param0, param1], vm.reftype.Value)
		),

		/** Is the first argument greater than or equal to the second? */
		ge: (param0: binaryen.ExpressionRef /* (ref $Value) */, param1: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* (ref $Value) */ => (
			vm.mod.call('op:ge', [param0, param1], vm.reftype.Value)
		),

		/** Are the arguments ‘identical’ per the Counterpoint definition? */
		id: (param0: binaryen.ExpressionRef /* (ref $Value) */, param1: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* (ref $Value) */ => (
			vm.mod.call('op:id', [param0, param1], vm.reftype.Value)
		),

		/** Are the arguments ‘equal’ per the Counterpoint definition? */
		eq: (param0: binaryen.ExpressionRef /* (ref $Value) */, param1: binaryen.ExpressionRef /* (ref $Value) */): binaryen.ExpressionRef /* (ref $Value) */ => (
			vm.mod.call('op:eq', [param0, param1], vm.reftype.Value)
		),
	} as const;
}
