import {
	strictEqual,
} from '../decorators.js';
import {
	VoidError01,
	Map_hasEq,
	Map_getEq,
	Map_setEq,
	AST,
} from './package.js';
import {solidObjectsIdentical} from './utils-private.js';
import {SolidType} from './SolidType.js';
import {SolidTypeConstant} from './SolidTypeConstant.js';
import {SolidTypeMap} from './SolidTypeMap.js';
import {SolidObject} from './SolidObject.js';
import {SolidNull} from './SolidNull.js';
import {Collection} from './Collection.js';



export class SolidMap<K extends SolidObject = SolidObject, V extends SolidObject = SolidObject> extends Collection {
	static override toString(): string {
		return 'Map';
	}
	static override values: SolidType['values'] = new Set([new SolidMap()]);


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
	@strictEqual
	@SolidObject.equalsDeco
	override equal(value: SolidObject): boolean {
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
			SolidType.unionAll([...this.cases.keys()]  .map<SolidType>((ant) => new SolidTypeConstant(ant))),
			SolidType.unionAll([...this.cases.values()].map<SolidType>((con) => new SolidTypeConstant(con))),
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
