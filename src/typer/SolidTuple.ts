import * as xjs from 'extrajs';
import type {Keys} from '../types';
import type {AST} from '../validator/index.js';
import {VoidError01} from '../error/index.js';
import {
	SolidType,
	SolidTypeConstant,
} from './SolidType.js';
import {SolidTypeTuple} from './SolidTypeTuple.js';
import {SolidObject} from './SolidObject.js';
import {SolidNull} from './SolidNull.js';
import {SolidBoolean} from './SolidBoolean.js';
import type {Int16} from './Int16.js';



export class SolidTuple<T extends SolidObject = SolidObject> extends SolidObject {
	static override toString(): string {
		return 'Tuple';
	}
	static override values: SolidType['values'] = new Set([new SolidTuple()]);
	private static readonly EQ_MEMO: xjs.MapEq<readonly [SolidTuple, SolidTuple], boolean> = new xjs.MapEq(
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
		return SolidTypeTuple.fromTypes(this.items.map((it) => new SolidTypeConstant(it)));
	}

	get(index: Int16, access_optional: boolean, accessor: AST.ASTNodeIndex | AST.ASTNodeExpression): T | SolidNull {
		const n: number = this.items.length;
		const i: number = Number(index.toNumeric());
		return (
			(-n <= i && i < 0) ? this.items[i + n] :
			(0  <= i && i < n) ? this.items[i] :
			(access_optional) ? SolidNull.NULL :
			(() => { throw new VoidError01(accessor); })()
		);
	}
}
