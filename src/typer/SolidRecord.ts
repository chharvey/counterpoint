import * as xjs from 'extrajs';
import type {Keys} from '../types';
import type * as AST from '../validator/index.js';
import {VoidError01} from '../error/index.js';
import {
	SolidType,
	SolidTypeConstant,
} from './SolidType.js';
import {SolidTypeRecord} from './SolidTypeRecord.js';
import {SolidObject} from './SolidObject.js';
import {SolidNull} from './SolidNull.js';



export class SolidRecord<T extends SolidObject = SolidObject> extends SolidObject {
	static override toString(): string {
		return 'Record';
	}
	static override values: SolidType['values'] = new Set([new SolidRecord()]);
	private static readonly EQ_MEMO: xjs.MapEq<readonly [SolidRecord, SolidRecord], boolean> = new xjs.MapEq(
		(a, b) => a[0].identical(b[0]) && a[1].identical(b[1]),
	);


	constructor (
		private readonly properties: ReadonlyMap<bigint, T> = new Map(),
	) {
		super();
	}
	override toString(): string {
		return `[${ [...this.properties].map(([key, value]) => `${ key.toString() }n= ${ value.toString() }`).join(', ') }]`;
	}
	override get isEmpty(): boolean {
		return this.properties.size === 0;
	}
	/** @final */
	protected override equal_helper(value: SolidObject): boolean {
		if (value instanceof SolidRecord && this.properties.size === value.properties.size) {
			const memokey: Keys<typeof SolidRecord.EQ_MEMO> = [this, value];
			if (!SolidRecord.EQ_MEMO.has(memokey)) {
				SolidRecord.EQ_MEMO.set(memokey, false); // use this assumption in the next step
				SolidRecord.EQ_MEMO.set(memokey, [...(value as SolidRecord).properties].every(
					([thatkey, thatvalue]) => this.properties.has(thatkey) && this.properties.get(thatkey)!.equal(thatvalue),
				));
			}
			return SolidRecord.EQ_MEMO.get(memokey)!;
		} else {
			return false;
		}
	}

	toType(): SolidTypeRecord {
		return SolidTypeRecord.fromTypes(new Map([...this.properties].map(([key, value]) => [key, new SolidTypeConstant(value)])));
	}

	get(key: bigint, access_optional: boolean, accessor: AST.ASTNodeKey): T | SolidNull {
		return (this.properties.has(key))
			? this.properties.get(key)!
			: (access_optional)
				? SolidNull.NULL
				: (() => {throw new VoidError01(accessor);})();
	}
}
