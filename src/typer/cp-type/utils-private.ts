import {
	Operator,
	ValidAccessOperator,
} from './package.js';
import type {TypeEntry} from './utils-public.js';
import {SolidType} from './index.js';



export function updateAccessedStaticType(entry: TypeEntry, access_kind: ValidAccessOperator): SolidType {
	return (access_kind === Operator.CLAIMDOT)
		? entry.type.subtract(SolidType.VOID)
		: (entry.optional)
			? entry.type.union((access_kind === Operator.OPTDOT) ? SolidType.NULL : SolidType.VOID)
			: entry.type;
}
