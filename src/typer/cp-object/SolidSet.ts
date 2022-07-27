import * as xjs from 'extrajs';
import {
	VoidError01,
	AST,
	solidObjectsIdentical,
	Type,
	TypeUnit,
	TypeSet,
} from './package.js';
import type {Object} from './Object.js';
import {SolidNull} from './SolidNull.js';
import {Collection} from './Collection.js';



export class SolidSet<T extends Object = Object> extends Collection {
	constructor (
		private readonly elements: ReadonlySet<T> = new Set(),
	) {
		super();
		const uniques: Set<T> = new Set();
		[...elements].forEach((el) => {
			xjs.Set.add(uniques, el, solidObjectsIdentical);
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
			value instanceof SolidSet
			&& this.elements.size === value.elements.size
			&& Collection.do_Equal<SolidSet>(this, value, () => [...(value as SolidSet).elements].every(
				(thatelement) => !![...this.elements].find((el) => el.equal(thatelement)),
			))
		);
	}

	override toType(): TypeSet {
		return new TypeSet(
			(this.elements.size)
				? Type.unionAll([...this.elements].map<Type>((el) => new TypeUnit(el)))
				: Type.NEVER,
		);
	}

	get(el: T, access_optional: boolean, accessor: AST.ASTNodeExpression): T | SolidNull {
		return (xjs.Set.has(this.elements, el, solidObjectsIdentical))
			? el
			: (access_optional)
				? SolidNull.NULL
				: (() => { throw new VoidError01(accessor); })();
	}
}
