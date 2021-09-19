import {
	Operator,
	ValidAccessOperator,
} from './package.js';
import type {TypeEntry} from './utils-public.js';
import {
	SolidType,
	SolidObject,
	SolidNull,
} from './index.js';



/**
 * Comparator function for checking “sameness” of `SolidType#values` set elements.
 * Values should be “the same” iff they are identical per the Solid specification.
 */
export const solidObjectsIdentical = (a: SolidObject, b: SolidObject): boolean => a.identical(b);



export function updateAccessedStaticType(entry: TypeEntry, access_kind: ValidAccessOperator): SolidType {
	return (access_kind === Operator.CLAIMDOT)
		? entry.type.subtract(SolidType.VOID)
		: entry.type.union((entry.optional) ? (access_kind === Operator.OPTDOT) ? SolidNull : SolidType.VOID : SolidType.NEVER);
}
