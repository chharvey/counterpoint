import * as assert from 'node:assert';
import type binaryen from 'binaryen';
import * as xjs from 'extrajs';
import {
	type Builder,
	VoidErrorOutOfBounds,
} from '../../index.ts';
import type {AST} from '../../validator/index.ts';
import {TYPE} from '../index.ts';
import {
	languageValuesIdentical,
	language_values_equal,
	strictEqual,
	instanceOf,
	memoizeBinOp,
} from '../utils-private.ts';
import {NULL} from './index.ts';
import {
	identical,
	type Value,
} from './Value.ts';
import type {Null} from './Null.ts';
import {Collection} from './Collection.ts';



/**
 * A dynamic unordered association of value–value pairs.
 * @final
 */
class ValueMap<K extends Value = Value, V extends Value = Value> extends Collection {
	public constructor(public readonly cases: ReadonlyMap<K, V> = new Map()) {
		super();
		const uniques = new Map<K, V>();
		[...cases].forEach(([ant, con]) => {
			xjs.Map.set(uniques, ant, con, languageValuesIdentical);
		});
		this.cases = uniques;
	}

	/**
	 * @implements Value
	 */
	public override get isEmpty(): boolean {
		return this.cases.size === 0;
	}

	/**
	 * @implements Collection
	 */
	public override get count(): bigint {
		return BigInt(this.cases.size);
	}

	public override toString(): string {
		return `{${ [...this.cases].map(([ant, con]) => `${ ant } -> ${ con }`).join(', ') }}`;
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
	 * Returns a TYPE.Map whose type arguments are the respective unions of the types of this ValueMap’s antecedents and consequents.
	 */
	public override toType(): TYPE.Map {
		return new TYPE.Map(
			TYPE.Union.all([...this.cases.keys()]   .map<TYPE.Type>((ant) => ant.toType())),
			TYPE.Union.all([...this.cases.values()] .map<TYPE.Type>((con) => con.toType())),
		);
	}

	public override build(_: Builder): binaryen.ExpressionRef {
		throw new Error('`ValueMap#build` not yet supported.');
	}

	public get(ant: K, is_access_maybe: boolean, accessor: AST.ASTNodeExpression): V | Null {
		return (
			xjs.Map.has(this.cases, ant, languageValuesIdentical) ? xjs.Map.get(this.cases, ant, languageValuesIdentical)! :
			is_access_maybe                                       ? NULL :
			assert.fail(new VoidErrorOutOfBounds('key', this, ant, accessor))
		);
	}
}
export {ValueMap as Map};
