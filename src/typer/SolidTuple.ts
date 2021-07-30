import * as xjs from 'extrajs';
import type {Keys} from '../types';
import {
	SolidType,
	SolidTypeConstant,
} from './SolidType.js';
import {SolidTypeTuple} from './SolidTypeTuple.js';
import {SolidObject} from './SolidObject.js';
import {SolidBoolean} from './SolidBoolean.js';



export class SolidTuple<T extends SolidObject> extends SolidObject {
	static override toString(): string {
		return 'Tuple';
	}
	static override values: SolidType['values'] = new Set([new SolidTuple()]);
	private static readonly EQ_MEMO: xjs.MapEq<readonly [SolidTuple<SolidObject>, SolidTuple<SolidObject>], boolean> = new xjs.MapEq(
		(a, b) => a[0].identical(b[0]) && a[1].identical(b[1]),
	);


	constructor (
		private readonly items: readonly T[] = [],
	) {
		super();
	}
	override toString(): string {
		return `[${ this.items.map((it) => it.toString()).join(', ') }]`;
	}
	override get isEmpty(): SolidBoolean {
		return SolidBoolean.fromBoolean(this.items.length === 0);
	}
	/** @final */
	protected override equal_helper(value: SolidObject): boolean {
		if (value instanceof SolidTuple && this.items.length === value.items.length) {
			const memokey: Keys<typeof SolidTuple.EQ_MEMO> = [this, value];
			if (!SolidTuple.EQ_MEMO.has(memokey)) {
				SolidTuple.EQ_MEMO.set(memokey, false); // use this assumption in the next step
				SolidTuple.EQ_MEMO.set(memokey, (value as this).items.every(
					(thatitem, i) => this.items[i].equal(thatitem)),
				);
			}
			return SolidTuple.EQ_MEMO.get(memokey)!;
		} else {
			return false;
		}
	}

	toType(): SolidTypeTuple {
		return new SolidTypeTuple(this.items.map((it) => new SolidTypeConstant(it)));
	}
}
