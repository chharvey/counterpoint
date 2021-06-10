import type {SolidLanguageType} from '../validator/SolidLanguageType'; // TODO circular imports
import {SolidObject} from '../validator/SolidObject';



export class SolidMapping<K extends SolidObject, V extends SolidObject> extends SolidObject {
	static override values: SolidLanguageType['values'] = new Set([new SolidMapping()]);


	constructor (
		readonly cases: ReadonlyMap<K, V> = new Map(),
	) {
		super();
	}
}
