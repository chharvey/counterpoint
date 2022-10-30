import * as xjs from 'extrajs';
import {
	VoidError01,
	throw_expression,
	AST,
	languageValuesIdentical,
	TYPE,
} from './package.js';
import type {Object as CPObject} from './Object.js';
import {Null} from './Null.js';
import {Collection} from './Collection.js';



class CPMap<K extends CPObject = CPObject, V extends CPObject = CPObject> extends Collection {
	public constructor(private readonly cases: ReadonlyMap<K, V> = new Map()) {
		super();
		const uniques = new Map<K, V>();
		[...cases].forEach(([ant, con]) => {
			xjs.Map.set(uniques, ant, con, languageValuesIdentical);
		});
		this.cases = uniques;
	}

	public override toString(): string {
		return `{${ [...this.cases].map(([ant, con]) => `${ ant } -> ${ con }`).join(', ') }}`;
	}

	public override get isEmpty(): boolean {
		return this.cases.size === 0;
	}

	/** @final */
	protected override equal_helper(value: CPObject): boolean {
		return (
			value instanceof CPMap
			&& this.cases.size === value.cases.size
			&& Collection.do_Equal<CPMap>(this, value, () => (
				[...value.cases].every(([thatant, thatcon]) => (
					!![...this.cases].find(([thisant, _]) => thisant.equal(thatant))?.[1].equal(thatcon)
				))
			))
		);
	}

	public override toType(): TYPE.TypeMap {
		return new TYPE.TypeMap(
			TYPE.Type.unionAll([...this.cases.keys()]  .map<TYPE.Type>((ant) => new TYPE.TypeUnit<K>(ant))),
			TYPE.Type.unionAll([...this.cases.values()].map<TYPE.Type>((con) => new TYPE.TypeUnit<V>(con))),
		);
	}

	public get(ant: K, access_optional: boolean, accessor: AST.ASTNodeExpression): V | Null {
		return (xjs.Map.has(this.cases, ant, languageValuesIdentical))
			? xjs.Map.get(this.cases, ant, languageValuesIdentical)!
			: (access_optional)
				? Null.NULL
				: throw_expression(new VoidError01(accessor));
	}
}
export {CPMap as Map};
