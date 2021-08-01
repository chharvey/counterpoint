import * as xjs from 'extrajs';
import {SetEq} from '../core/index.js';
import type {Keys} from '../types';
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
	private static readonly EQ_MEMO: xjs.MapEq<readonly [SolidSet, SolidSet], boolean> = new xjs.MapEq(
		(a, b) => a[0].identical(b[0]) && a[1].identical(b[1]),
	);


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
	/** @final */
	protected override equal_helper(value: SolidObject): boolean {
		if (value instanceof SolidSet && this.elements.size === value.elements.size) {
			const memokey: Keys<typeof SolidSet.EQ_MEMO> = [this, value];
			if (!SolidSet.EQ_MEMO.has(memokey)) {
				SolidSet.EQ_MEMO.set(memokey, false); // use this assumption in the next step
				SolidSet.EQ_MEMO.set(memokey, [...(value as SolidSet).elements].every(
					(thatelement) => !![...this.elements].find((el) => el.equal(thatelement)),
				));
			}
			return SolidSet.EQ_MEMO.get(memokey)!;
		} else {
			return false;
		}
	}

	toType(): SolidTypeSet {
		return new SolidTypeSet(
			(this.elements.size)
				? [...this.elements].map<SolidType>((el) => new SolidTypeConstant(el)).reduce((a, b) => a.union(b))
				: SolidType.NEVER,
		);
	}
}