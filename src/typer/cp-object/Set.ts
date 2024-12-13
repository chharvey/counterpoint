import * as xjs from 'extrajs';
import {
	strictEqual,
	instanceOf,
} from '../../lib/index.js';
import {TYPE} from '../index.js';
import {
	languageValuesIdentical,
	language_values_equal,
} from '../utils-private.js';
import {
	equalsDeco,
	memoizeSameness,
} from './decorators.js';
import type {Object as CPObject} from './Object.js';
import {Boolean as CPBoolean} from './Boolean.js';
import {Collection} from './Collection.js';



class CPSet<T extends CPObject = CPObject> extends Collection {
	public constructor(private readonly elements: ReadonlySet<T> = new Set()) {
		super();
		const uniques = new Set<T>();
		[...elements].forEach((el) => {
			xjs.Set.add(uniques, el, languageValuesIdentical);
		});
		this.elements = uniques;
	}

	public override toString(): string {
		return `{${ [...this.elements].map((el) => el.toString()).join(', ') }}`;
	}

	public override get isEmpty(): boolean {
		return this.elements.size === 0;
	}

	/** @final */
	@strictEqual
	@equalsDeco
	@instanceOf(() => CPSet)
	@memoizeSameness
	public override equal(value: CPObject): boolean {
		return xjs.Set.is<CPObject>(this.elements, (value as CPSet).elements, language_values_equal);
	}

	/**
	 * @inheritdoc
	 * Returns a TypeSet whose invariant is the union of the types of this Set’s elements.
	 */
	public override toType(): TYPE.TypeSet {
		return new TYPE.TypeSet(TYPE.TypeUnion.all([...this.elements].map<TYPE.Type>((el) => el.toType())));
	}

	public get(el: T): CPBoolean {
		return (xjs.Set.has(this.elements, el, languageValuesIdentical))
			? CPBoolean.TRUE
			: CPBoolean.FALSE;
	}
}
export {CPSet as Set};
