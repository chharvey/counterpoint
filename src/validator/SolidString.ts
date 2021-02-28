import type {CodeUnit} from '../types';
import {SolidObject} from './SolidObject';



export class SolidString extends SolidObject {
	constructor (
		_codeunits: readonly CodeUnit[],
	) {
		super();
	}
}
