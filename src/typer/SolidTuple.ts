import type {SolidType} from './SolidType';
import {SolidObject} from './SolidObject';
import {SolidBoolean} from './SolidBoolean';



export class SolidTuple<T extends SolidObject> extends SolidObject {
	static override toString(): string {
		return 'Tuple';
	}
	static override values: SolidType['values'] = new Set([new SolidTuple()]);


	constructor (
		readonly items: readonly T[] = [],
	) {
		super();
	}
	override toString(): string {
		return `[${ this.items.map((it) => it.toString()).join(', ') }]`;
	}
	override get isEmpty(): SolidBoolean {
		return SolidBoolean.fromBoolean(this.items.length === 0);
	}
}
