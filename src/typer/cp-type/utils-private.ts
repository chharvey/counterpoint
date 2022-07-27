import {
	Operator,
	ValidAccessOperator,
	TypeEntry,
} from './package.js';
import {Type} from './index.js';



export function updateAccessedStaticType(entry: TypeEntry, access_kind: ValidAccessOperator): Type {
	return (access_kind === Operator.CLAIMDOT)
		? entry.type.subtract(Type.VOID)
		: (entry.optional)
			? entry.type.union((access_kind === Operator.OPTDOT) ? Type.NULL : Type.VOID)
			: entry.type;
}
