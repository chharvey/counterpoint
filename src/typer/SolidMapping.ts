import * as xjs from 'extrajs';
import type {Keys} from '../types';
import type {AST} from '../validator/index.js';
import {VoidError01} from '../error/index.js';
import {
	SolidType,
	SolidTypeConstant,
} from './SolidType.js';
import {SolidTypeMapping} from './SolidTypeMapping.js';
import {SolidObject} from './SolidObject.js';
import {SolidBoolean} from './SolidBoolean.js';



export class SolidMapping<K extends SolidObject = SolidObject, V extends SolidObject = SolidObject> extends SolidObject {
	static override toString(): string {
		return 'Mapping';
	}
	static override values: SolidType['values'] = new Set([new SolidMapping()]);
	private static readonly EQ_MEMO: xjs.MapEq<readonly [SolidMapping, SolidMapping], boolean> = new xjs.MapEq(
		(a, b) => a[0].identical(b[0]) && a[1].identical(b[1]),
	);
	/**
	 * Comparator for all internal mappings.
	 * @param key1 a key
	 * @param key2 a key
	 * @returns are the keys ‘identical’ per Solid specification?
	 */
	private static comparator(key1: SolidObject, key2: SolidObject): boolean {
		return key1.identical(key2);
	}


	private readonly cases: ReadonlyMap<K, V>;
	constructor (cases: ReadonlyMap<K, V> = new Map()) {
		super();
		this.cases = new xjs.MapEq(SolidMapping.comparator, [...cases]);
	}
	override toString(): string {
		return `{${ [...this.cases].map(([ant, con]) => `${ ant.toString() } |-> ${ con.toString() }`).join(', ') }}`;
	}
	override get isEmpty(): SolidBoolean {
		return SolidBoolean.fromBoolean(this.cases.size === 0);
	}
	/** @final */
	protected override equal_helper(value: SolidObject): boolean {
		if (value instanceof SolidMapping && this.cases.size === value.cases.size) {
			const memokey: Keys<typeof SolidMapping.EQ_MEMO> = [this, value];
			if (!SolidMapping.EQ_MEMO.has(memokey)) {
				SolidMapping.EQ_MEMO.set(memokey, false); // use this assumption in the next step
				SolidMapping.EQ_MEMO.set(memokey, [...(value as this).cases].every(
					([thatant, thatcon]) => this.cases.has(thatant) && this.cases.get(thatant)!.equal(thatcon)),
				);
			}
			return SolidMapping.EQ_MEMO.get(memokey)!;
		} else {
			return false;
		}
	}

	toType(): SolidTypeMapping {
		return new SolidTypeMapping(
			[...this.cases.keys()]  .map<SolidType>((ant) => new SolidTypeConstant(ant)).reduce((a, b) => a.union(b)),
			[...this.cases.values()].map<SolidType>((con) => new SolidTypeConstant(con)).reduce((a, b) => a.union(b)),
		);
	}

	get(ant: K, accessor: AST.ASTNodeIndex | AST.ASTNodeKey | AST.ASTNodeExpression): V {
		return (this.cases.has(ant))
			? this.cases.get(ant)!
			: (() => { throw new VoidError01(accessor); })();
	}
}
