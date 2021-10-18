import {
	VoidError01,
	strictEqual,
	Set_hasEq,
	Set_addEq,
	AST,
} from './package.js';
import {solidObjectsIdentical} from './utils-private.js';
import {SolidType} from './SolidType.js';
import {SolidTypeUnit} from './SolidTypeUnit.js';
import {SolidTypeSet} from './SolidTypeSet.js';
import {SolidObject} from './SolidObject.js';
import {SolidNull} from './SolidNull.js';
import {Collection} from './Collection.js';



export class SolidSet<T extends SolidObject = SolidObject> extends Collection {
	constructor (
		private readonly elements: ReadonlySet<T> = new Set(),
	) {
		super();
		const uniques: Set<T> = new Set();
		[...elements].forEach((el) => {
			Set_addEq(uniques, el, solidObjectsIdentical);
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
	@SolidObject.equalsDeco
	override equal(value: SolidObject): boolean {
		return (
			value instanceof SolidSet
			&& this.elements.size === value.elements.size
			&& Collection.do_Equal<SolidSet>(this, value, () => [...(value as SolidSet).elements].every(
				(thatelement) => !![...this.elements].find((el) => el.equal(thatelement)),
			))
		);
	}

	override toType(): SolidTypeSet {
		return new SolidTypeSet(
			(this.elements.size)
				? SolidType.unionAll([...this.elements].map<SolidType>((el) => new SolidTypeUnit(el)))
				: SolidType.NEVER,
		);
	}

	get(el: T, access_optional: boolean, accessor: AST.ASTNodeExpression): T | SolidNull {
		return (Set_hasEq(this.elements, el, solidObjectsIdentical))
			? el
			: (access_optional)
				? SolidNull.NULL
				: (() => { throw new VoidError01(accessor); })();
	}
}
