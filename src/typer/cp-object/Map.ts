import * as xjs from 'extrajs';
import {
	VoidError01,
	AST,
	languageValuesIdentical,
	TYPE,
} from './package.js';
import type {Object} from './Object.js';
import {Null} from './Null.js';
import {Collection} from './Collection.js';



class CPMap<K extends Object = Object, V extends Object = Object> extends Collection {
	constructor (
		private readonly cases: ReadonlyMap<K, V> = new Map(),
	) {
		super();
		const uniques: Map<K, V> = new Map();
		[...cases].forEach(([ant, con]) => {
			xjs.Map.set(uniques, ant, con, languageValuesIdentical);
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
			value instanceof CPMap
			&& this.cases.size === value.cases.size
			&& Collection.do_Equal<CPMap>(this, value, () => [...(value as CPMap).cases].every(
				([thatant, thatcon]) => !![...this.cases].find(([thisant, _]) => thisant.equal(thatant))?.[1].equal(thatcon),
			))
		);
	}

	override toType(): TYPE.TypeMap {
		return (this.cases.size) ? new TYPE.TypeMap(
			TYPE.Type.unionAll([...this.cases.keys()]  .map<TYPE.Type>((ant) => new TYPE.TypeUnit<K>(ant))),
			TYPE.Type.unionAll([...this.cases.values()].map<TYPE.Type>((con) => new TYPE.TypeUnit<V>(con))),
		) : new TYPE.TypeMap(TYPE.Type.NEVER, TYPE.Type.NEVER);
	}

	get(ant: K, access_optional: boolean, accessor: AST.ASTNodeExpression): V | Null {
		return (xjs.Map.has(this.cases, ant, languageValuesIdentical))
			? xjs.Map.get(this.cases, ant, languageValuesIdentical)!
			: (access_optional)
				? Null.NULL
				: (() => { throw new VoidError01(accessor); })();
	}
}
export {CPMap as Map};
