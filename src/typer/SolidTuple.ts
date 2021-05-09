import type {SolidLanguageType} from '../validator/SolidLanguageType'; // TODO circular imports
import {SolidObject} from '../validator/SolidObject';



export class SolidTuple<T extends SolidObject> extends SolidObject {
	/** @overrides SolidObject */
	static values: SolidLanguageType['values'] = new Set([new SolidTuple()]);


	constructor (
		readonly items: readonly T[] = [],
	) {
		super();
	}
}
