import * as xjs from 'extrajs';
import {strictEqual} from '../../lib/index.js';
import {TYPE} from '../index.js';
import {languageValuesIdentical} from '../utils-private.js';
import {Object as CPObject} from './Object.js';
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
	@CPObject.equalsDeco
	public override equal(value: CPObject): boolean {
		return (
			value instanceof CPSet
			&& this.elements.size === value.elements.size
			&& Collection.do_Equal<CPSet>(this, value, () => (
				[...value.elements].every((thatelement) => (
					!![...this.elements].find((el) => el.equal(thatelement))
				))
			))
		);
	}

	/**
	 * @inheritdoc
	 * Returns a TypeSet whose invariant is the union of the types of this Set’s elements.
	 */
	public override toType(): TYPE.TypeSet {
		return new TYPE.TypeSet(TYPE.Type.unionAll([...this.elements].map<TYPE.Type>((el) => el.toType())));
	}

	public get(el: T): CPBoolean {
		return (xjs.Set.has(this.elements, el, languageValuesIdentical))
			? CPBoolean.TRUE
			: CPBoolean.FALSE;
	}
}
export {CPSet as Set};
