import * as xjs from 'extrajs';
import {
	languageValuesIdentical,
	Type,
	TypeSet,
} from './package.js';
import type {Object as CPObject} from './Object.js';
import {Boolean as CPBoolean} from './Boolean.js';
import {Collection} from './Collection.js';



class CPSet<T extends CPObject = CPObject> extends Collection {
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
	protected override equal_helper(value: CPObject): boolean {
		return (
			value instanceof CPSet
			&& this.elements.size === value.elements.size
			&& Collection.do_Equal<CPSet>(this, value, () => [...(value as CPSet).elements].every(
				(thatelement) => !![...this.elements].find((el) => el.equal(thatelement)),
			))
		);
	}

	override toType(): TypeSet {
		return new TypeSet(
			(this.elements.size)
				? Type.unionAll([...this.elements].map<Type>((el) => el.toType()))
				: Type.NEVER,
		);
	}

	get(el: T): CPBoolean {
		return (xjs.Set.has(this.elements, el, languageValuesIdentical))
			? CPBoolean.TRUE
			: CPBoolean.FALSE;
	}
}
export {CPSet as Set};
