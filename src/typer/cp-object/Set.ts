import * as xjs from 'extrajs';
import {
	strictEqual,
	languageValuesIdentical,
	Type,
	TypeUnit,
	TypeSet,
} from './package.js';
import {Object as CPObject} from './Object.js';
import {Boolean} from './Boolean.js';
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
	@strictEqual
	@CPObject.equalsDeco
	override equal(value: CPObject): boolean {
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
				? Type.unionAll([...this.elements].map<Type>((el) => new TypeUnit<T>(el)))
				: Type.NEVER,
		);
	}

	get(el: T): Boolean {
		return (xjs.Set.has(this.elements, el, languageValuesIdentical))
			? Boolean.TRUE
			: Boolean.FALSE;
	}
}
export {CPSet as Set};
