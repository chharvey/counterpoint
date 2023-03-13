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
	protected override equal_helper(value: CPObject): boolean {
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

	public override toType(): TypeSet {
		return new TypeSet(Type.unionAll([...this.elements].map<Type>((el) => el.toType())));
	}

	public get(el: T): CPBoolean {
		return (xjs.Set.has(this.elements, el, languageValuesIdentical))
			? CPBoolean.TRUE
			: CPBoolean.FALSE;
	}
}
export {CPSet as Set};
