import * as xjs from 'extrajs';
import {
	VoidError01,
	strictEqual,
	AST,
	solidObjectsIdentical,
	SolidType,
	SolidTypeUnit,
	SolidTypeMap,
} from './package.js';
import {SolidObject} from './SolidObject.js';
import {SolidNull} from './SolidNull.js';
import {Collection} from './Collection.js';



export class SolidMap<K extends SolidObject = SolidObject, V extends SolidObject = SolidObject> extends Collection {
	constructor (
		private readonly cases: ReadonlyMap<K, V> = new Map(),
	) {
		super();
		const uniques: Map<K, V> = new Map();
		[...cases].forEach(([ant, con]) => {
			xjs.Map.set(uniques, ant, con, solidObjectsIdentical);
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
			SolidType.unionAll([...this.cases.keys()]  .map<SolidType>((ant) => new SolidTypeUnit(ant))),
			SolidType.unionAll([...this.cases.values()].map<SolidType>((con) => new SolidTypeUnit(con))),
		) : new SolidTypeMap(SolidType.NEVER, SolidType.NEVER);
	}

	get(ant: K, access_optional: boolean, accessor: AST.ASTNodeExpression): V | SolidNull {
		return (xjs.Map.has(this.cases, ant, solidObjectsIdentical))
			? xjs.Map.get(this.cases, ant, solidObjectsIdentical)!
			: (access_optional)
				? SolidNull.NULL
				: (() => { throw new VoidError01(accessor); })();
	}
}
