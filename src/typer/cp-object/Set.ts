import * as xjs from 'extrajs';
import {
	languageValuesIdentical,
	TYPE,
} from './package.js';
import type {Object} from './Object.js';
import {Boolean} from './Boolean.js';
import {Collection} from './Collection.js';



class CPSet<T extends Object = Object> extends Collection {
	constructor (
		private readonly elements: ReadonlySet<T> = new Set(),
	) {
		super();
		const uniques: Set<T> = new Set();
		[...elements].forEach((el) => {
			xjs.Set.add(uniques, el, languageValuesIdentical);
		});
		this.elements = uniques;
	}
	override toString(): string {
		return `{${ [...this.elements].map((el) => el.toString()).join(', ') }}`;
	}
	override get isEmpty(): boolean {
		return this.elements.size === 0;
	}
	/** @final */
	protected override equal_helper(value: Object): boolean {
		return (
			value instanceof CPSet
			&& this.elements.size === value.elements.size
			&& Collection.do_Equal<CPSet>(this, value, () => [...(value as CPSet).elements].every(
				(thatelement) => !![...this.elements].find((el) => el.equal(thatelement)),
			))
		);
	}

	override toType(): TYPE.TypeSet {
		return new TYPE.TypeSet(
			(this.elements.size)
				? TYPE.Type.unionAll([...this.elements].map<TYPE.Type>((el) => new TYPE.TypeUnit<T>(el)))
				: TYPE.NEVER,
		);
	}

	get(el: T): Boolean {
		return (xjs.Set.has(this.elements, el, languageValuesIdentical))
			? Boolean.TRUE
			: Boolean.FALSE;
	}
}
export {CPSet as Set};
