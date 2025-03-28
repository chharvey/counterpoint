import * as assert from 'assert';
import * as xjs from 'extrajs';
import {VoidError01} from '../../index.js';
import type {AST} from '../../validator/index.js';
import {TYPE} from '../index.js';
import {
	languageValuesIdentical,
	language_values_equal,
	strictEqual,
	instanceOf,
	memoizeBinOp,
} from '../utils-private.js';
import {NULL} from './index.js';
import {
	identical,
	type Value,
} from './Value.js';
import type {Null} from './Null.js';
import {Collection} from './Collection.js';



/**
 * A dynamic unordered association of value–value pairs.
 * @final
 */
class ValueMap<K extends Value = Value, V extends Value = Value> extends Collection {
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
	@strictEqual
	@instanceOf(() => ValueMap)
	@identical
	@memoizeBinOp(true, true)
	public override equal(value: Value): boolean {
		return (
			this.cases.size === (value as ValueMap).cases.size &&
			[...(value as ValueMap).cases].every(([thatant, thatcon]) => !!xjs.Map.get<Value, Value>(this.cases, thatant, language_values_equal)?.equal(thatcon))
		);
	}

	/**
	 * @inheritdoc
	 * Returns a TYPE.Map whose invariants are the respective unions of the types of this ValueMap’s antecedents and consequents.
	 */
	public override toType(): TYPE.Map {
		return new TYPE.Map(
			TYPE.Union.all([...this.cases.keys()]   .map<TYPE.Type>((ant) => ant.toType())),
			TYPE.Union.all([...this.cases.values()] .map<TYPE.Type>((con) => con.toType())),
		);
	}

	public get(ant: K, access_optional: boolean, accessor: AST.ASTNodeExpression): V | Null {
		return (
			xjs.Map.has(this.cases, ant, languageValuesIdentical) ? xjs.Map.get(this.cases, ant, languageValuesIdentical)! :
			access_optional                                       ? NULL :
			assert.fail(new VoidError01(accessor))
		);
	}
}
export {ValueMap as Map};
