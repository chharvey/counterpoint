import * as xjs from 'extrajs';
import {
	VoidError01,
	throw_expression,
	AST,
	languageValuesIdentical,
	Type,
	TypeUnit,
	TypeSet,
} from './package.js';
import type {Object as CPObject} from './Object.js';
import {Null} from './Null.js';
import {Collection} from './Collection.js';



class CPSet<T extends CPObject = CPObject> extends Collection {
	constructor(private readonly elements: ReadonlySet<T> = new Set()) {
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
			&& Collection.do_Equal<CPSet>(this, value, () => (
				[...value.elements].every((thatelement) => (
					!![...this.elements].find((el) => el.equal(thatelement))
				))
			))
		);
	}

	override toType(): TypeSet {
		return new TypeSet(Type.unionAll([...this.elements].map<Type>((el) => new TypeUnit(el))));
	}

	get(el: T, access_optional: boolean, accessor: AST.ASTNodeExpression): T | Null {
		return (xjs.Set.has(this.elements, el, languageValuesIdentical))
			? el
			: (access_optional)
				? Null.NULL
				: throw_expression(new VoidError01(accessor));
	}
}
export {CPSet as Set};
