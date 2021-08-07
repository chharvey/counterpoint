import type {AST} from '../validator/index.js';
import {VoidError01} from '../error/index.js';
import {
	SolidType,
	SolidTypeConstant,
} from './SolidType.js';
import {SolidTypeTuple} from './SolidTypeTuple.js';
import type {SolidObject} from './SolidObject.js';
import {SolidNull} from './SolidNull.js';
import {SolidBoolean} from './SolidBoolean.js';
import type {Int16} from './Int16.js';
import {Collection} from './Collection.js';



export class SolidTuple<T extends SolidObject = SolidObject> extends Collection {
	static override toString(): string {
		return 'Tuple';
	}
	static override values: SolidType['values'] = new Set([new SolidTuple()]);


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
		return (
			value instanceof SolidTuple
			&& this.items.length === value.items.length
			&& Collection.do_Equal<SolidTuple>(this, value, () => (value as SolidTuple).items.every(
				(thatitem, i) => this.items[i].equal(thatitem),
			))
		);
	}

	override toType(): SolidTypeTuple {
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
