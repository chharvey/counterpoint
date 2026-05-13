import binaryen from 'binaryen';
import type {VirtualMachine} from '../VirtualMachine.ts';



/** Struct field constant indices. */
const FIELD = {
	/** `$Case.$ant` */ ANT: 0,
	/** `$Case.$con` */ CON: 1,
} as const;



export class Case {
	public constructor(private readonly vm: VirtualMachine) {}


	public field(ref: binaryen.ExpressionRef /* (ref null $Case) */): {
		readonly ant: binaryen.ExpressionRef /* (ref $Value) */,
		readonly con: binaryen.ExpressionRef /* (ref $Value) */,
	} {
		const {mod, reftype} = this.vm;
		return {
			/** @return `(struct.get $Case $ant <ref>)` */ get ant(): binaryen.ExpressionRef /* (ref $Value) */ { return mod.struct.get(FIELD.ANT, ref, reftype.Value); },
			/** @return `(struct.get $Case $con <ref>)` */ get con(): binaryen.ExpressionRef /* (ref $Value) */ { return mod.struct.get(FIELD.CON, ref, reftype.Value); },
		};
	}


	/**
	 * Returns whether a Case is a “tombstone”, that is, whether it represents a deletion in a Map.
	 *
	 * Case tombstones are used when deleting Map entries so as not to break linear probing chains.
	 * They may be returned when looking up an antecedent for which an entry has since been deleted.
	 * Application code should treat tombstones as non-entries —
	 * they should be treated the same as null when getting, and should be replaced when setting.
	 *
	 * A Case tombstone is implemented as a pair of Values both with a tag of `0`.
	 * This will not conflict with real Cases, pairs of Values whose tags are `1` or `2`.
	 * (A case containing one Value with a tag of `1` or `2` and one with a tag of `0` is not a valid Case.)
	 *
	 * Case tombstones contribute to the load factor of a Map:
	 * they are counted when determining when a Map’s array should be grown or shrunk.
	 * When growing/shrinking an array, tombstones are not copied over to the new array.
	 */
	public isTombstone(param0: binaryen.ExpressionRef /* (ref null $Case) */): binaryen.ExpressionRef /* i32 */ {
		return this.vm.mod.call('Case.is-tombstone', [param0], binaryen.i32);
	}
}
