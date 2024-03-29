import {
	VoidError01,
	Map_hasEq,
	Map_getEq,
	Map_setEq,
	AST,
} from './package.js';
import {solidObjectsIdentical} from './utils-private.js';
import {SolidType} from './SolidType.js';
import {SolidTypeMap} from './SolidTypeMap.js';
import type {SolidObject} from './SolidObject.js';
import {SolidNull} from './SolidNull.js';
import {Collection} from './Collection.js';



export class SolidMap<K extends SolidObject = SolidObject, V extends SolidObject = SolidObject> extends Collection {
	constructor (
		private readonly cases: ReadonlyMap<K, V> = new Map(),
	) {
		super();
		const uniques: Map<K, V> = new Map();
		[...cases].forEach(([ant, con]) => {
			Map_setEq(uniques, ant, con, solidObjectsIdentical);
		});
		this.cases = uniques;
	}
	override toString(): string {
		return `{${ [...this.cases].map(([ant, con]) => `${ ant } -> ${ con }`).join(', ') }}`;
	}
	override get isEmpty(): boolean {
		return this.cases.size === 0;
	}
	/** @final */
	protected override equal_helper(value: SolidObject): boolean {
		return (
			value instanceof SolidMap
			&& this.cases.size === value.cases.size
			&& Collection.do_Equal<SolidMap>(this, value, () => [...(value as SolidMap).cases].every(
				([thatant, thatcon]) => !![...this.cases].find(([thisant, _]) => thisant.equal(thatant))?.[1].equal(thatcon),
			))
		);
	}

	override toType(): SolidTypeMap {
		return (this.cases.size) ? new SolidTypeMap(
			SolidType.unionAll([...this.cases.keys   ()].map<SolidType>((ant) => ant.toType())),
			SolidType.unionAll([...this.cases.values ()].map<SolidType>((con) => con.toType())),
		) : new SolidTypeMap(SolidType.NEVER, SolidType.NEVER);
	}

	get(ant: K, access_optional: boolean, accessor: AST.ASTNodeExpression): V | SolidNull {
		return (Map_hasEq(this.cases, ant, solidObjectsIdentical))
			? Map_getEq(this.cases, ant, solidObjectsIdentical)!
			: (access_optional)
				? SolidNull.NULL
				: (() => { throw new VoidError01(accessor); })();
	}
}
