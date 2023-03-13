import * as xjs from 'extrajs';
import {VoidError01} from '../../index.js';
import {throw_expression} from '../../lib/index.js';
import type {AST} from '../../validator/index.js';
import {TYPE} from '../index.js';
import {languageValuesIdentical} from '../utils-private.js';
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

	/**
	 * @inheritdoc
	 * Returns a TypeMap whose invariants are the respective unions of the types of this Map’s antecedents and consequents.
	 */
	public override toType(): TYPE.TypeMap {
		return new TYPE.TypeMap(
			TYPE.Type.unionAll([...this.cases.keys()]  .map<TYPE.Type>((ant) => ant.toType())),
			TYPE.Type.unionAll([...this.cases.values()].map<TYPE.Type>((con) => con.toType())),
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
