import {
	Operator,
	type ValidAccessOperator,
} from '../../validator/index.js';
import type {TypeEntry} from '../utils-public.js';
import {
	type Type,
	VOID,
	NULL,
} from './index.js';



export function updateAccessedStaticType(entry: TypeEntry, access_kind: ValidAccessOperator): Type {
	return (access_kind === Operator.CLAIMDOT)
		? entry.type.subtract(VOID)
		: (entry.optional)
			? entry.type.union((access_kind === Operator.OPTDOT) ? NULL : VOID)
			: entry.type;
}
