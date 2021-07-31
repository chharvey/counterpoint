import {SetEq} from '../core/index.js';
import {
	SolidType,
	SolidTypeConstant,
} from './SolidType.js';
import {SolidTypeSet} from './SolidTypeSet.js';
import {SolidObject} from './SolidObject.js';
import {SolidBoolean} from './SolidBoolean.js';



export class SolidSet<T extends SolidObject = SolidObject> extends SolidObject {
	static override toString(): string {
		return 'Set';
	}
	static override values: SolidType['values'] = new Set([new SolidSet()]);


	/**
	 * Comparator for all internal sets.
	 * @param el1 an element
	 * @param el2 an element
	 * @returns are the elements ‘identical’ per Solid specification?
	 */
	private static comparator(el1: SolidObject, el2: SolidObject): boolean {
		return el1.identical(el2);
	}


	private readonly elements: ReadonlySet<T>;
	constructor (elements: ReadonlySet<T> = new Set()) {
		super();
		this.elements = new SetEq(SolidSet.comparator, elements);
	}
	override toString(): string {
		return `{${ [...this.elements].map((el) => el.toString()).join(', ') }}`;
	}
	override get isEmpty(): SolidBoolean {
		return SolidBoolean.fromBoolean(this.elements.size === 0);
	}

	toType(): SolidTypeSet {
		return new SolidTypeSet(
			[...this.elements].map<SolidType>((el) => new SolidTypeConstant(el)).reduce((a, b) => a.union(b)),
		);
	}
}
