import type {SolidType} from './SolidType';
import {SolidObject} from './SolidObject';



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
}
