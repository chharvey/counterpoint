import {
	Set_addEq,
	Set_hasEq,
} from '../lib/index.js';
import type {AST} from '../validator/index.js';
import {VoidError01} from '../error/index.js';
import {
	SolidType,
	SolidTypeConstant,
	solidObjectsIdentical,
} from './SolidType.js';
import {SolidTypeSet} from './SolidTypeSet.js';
import type {SolidObject} from './SolidObject.js';
import {SolidNull} from './SolidNull.js';
import {SolidBoolean} from './SolidBoolean.js';
import {Collection} from './Collection.js';



export class SolidSet<T extends SolidObject = SolidObject> extends Collection {
	static override toString(): string {
		return 'Set';
	}
	static override values: SolidType['values'] = new Set([new SolidSet()]);


	constructor (private readonly elements: ReadonlySet<T> = new Set()) {
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
	override get isEmpty(): SolidBoolean {
		return SolidBoolean.fromBoolean(this.elements.size === 0);
	}
	/** @final */
	protected override equal_helper(value: SolidObject): boolean {
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
				? [...this.elements].map<SolidType>((el) => new SolidTypeConstant(el)).reduce((a, b) => a.union(b))
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
