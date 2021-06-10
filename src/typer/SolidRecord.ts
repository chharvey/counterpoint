import type {SolidLanguageType} from '../validator/SolidLanguageType'; // TODO circular imports
import {SolidObject} from '../validator/SolidObject';



export class SolidRecord<T extends SolidObject> extends SolidObject {
	static override values: SolidLanguageType['values'] = new Set([new SolidRecord()]);


	constructor (
		readonly properties: ReadonlyMap<bigint, T> = new Map(),
	) {
		super();
	}
}
