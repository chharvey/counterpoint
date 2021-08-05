import * as xjs from 'extrajs';
import type {Keys} from '../types';
import {
	Set_addEq,
} from '../lib/index.js';
import {
	SolidType,
	SolidTypeConstant,
	solidObjectsIdentical,
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
