import * as xjs from 'extrajs';
import {
	VoidError01,
	AST,
	solidObjectsIdentical,
	Type,
	TypeUnit,
	TypeMap,
} from './package.js';
import type {Object} from './Object.js';
import {SolidNull} from './SolidNull.js';
import {Collection} from './Collection.js';



export class SolidMap<K extends Object = Object, V extends Object = Object> extends Collection {
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
	protected override equal_helper(value: Object): boolean {
		return (
			value instanceof SolidMap
			&& this.cases.size === value.cases.size
			&& Collection.do_Equal<SolidMap>(this, value, () => [...(value as SolidMap).cases].every(
				([thatant, thatcon]) => !![...this.cases].find(([thisant, _]) => thisant.equal(thatant))?.[1].equal(thatcon),
			))
		);
	}

	override toType(): TypeMap {
		return (this.cases.size) ? new TypeMap(
			Type.unionAll([...this.cases.keys()]  .map<Type>((ant) => new TypeUnit(ant))),
			Type.unionAll([...this.cases.values()].map<Type>((con) => new TypeUnit(con))),
		) : new TypeMap(Type.NEVER, Type.NEVER);
	}

	get(ant: K, access_optional: boolean, accessor: AST.ASTNodeExpression): V | SolidNull {
		return (xjs.Map.has(this.cases, ant, solidObjectsIdentical))
			? xjs.Map.get(this.cases, ant, solidObjectsIdentical)!
			: (access_optional)
				? SolidNull.NULL
				: (() => { throw new VoidError01(accessor); })();
	}
}
