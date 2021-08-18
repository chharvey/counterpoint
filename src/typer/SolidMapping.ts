import {
	Map_getEq,
	Map_hasEq,
	Map_setEq,
} from '../lib/index.js';
import type {AST} from '../validator/index.js';
import {VoidError01} from '../error/index.js';
import {
	SolidType,
	SolidTypeConstant,
	solidObjectsIdentical,
} from './SolidType.js';
import {SolidTypeMapping} from './SolidTypeMapping.js';
import type {SolidObject} from './SolidObject.js';
import {SolidNull} from './SolidNull.js';
import {Collection} from './Collection.js';



export class SolidMapping<K extends SolidObject = SolidObject, V extends SolidObject = SolidObject> extends Collection {
	static override toString(): string {
		return 'Mapping';
	}
	static override values: SolidType['values'] = new Set([new SolidMapping()]);


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
		return `{${ [...this.cases].map(([ant, con]) => `${ ant } |-> ${ con }`).join(', ') }}`;
	}
	override get isEmpty(): boolean {
		return this.cases.size === 0;
	}
	/** @final */
	protected override equal_helper(value: SolidObject): boolean {
		return (
			value instanceof SolidMapping
			&& this.cases.size === value.cases.size
			&& Collection.do_Equal<SolidMapping>(this, value, () => [...(value as SolidMapping).cases].every(
				([thatant, thatcon]) => !![...this.cases].find(([thisant, _]) => thisant.equal(thatant))?.[1].equal(thatcon),
			))
		);
	}

	override toType(): SolidTypeMapping {
		return (this.cases.size) ? new SolidTypeMapping(
			SolidType.unionAll([...this.cases.keys()]  .map<SolidType>((ant) => new SolidTypeConstant(ant))),
			SolidType.unionAll([...this.cases.values()].map<SolidType>((con) => new SolidTypeConstant(con))),
		) : new SolidTypeMapping(SolidType.NEVER, SolidType.NEVER);
	}

	get(ant: K, access_optional: boolean, accessor: AST.ASTNodeExpression): V | SolidNull {
		return (Map_hasEq(this.cases, ant, solidObjectsIdentical))
			? Map_getEq(this.cases, ant, solidObjectsIdentical)!
			: (access_optional)
				? SolidNull.NULL
				: (() => { throw new VoidError01(accessor); })();
	}
}
