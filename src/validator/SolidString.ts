import * as xjs from 'extrajs';

import type {CodeUnit} from '../types';
import {SolidObject} from './SolidObject';
import {SolidBoolean} from './SolidBoolean';



export class SolidString extends SolidObject {
	constructor (
		private readonly codeunits: readonly CodeUnit[],
	) {
		super();
	}

	/** @override SolidObject */
	get isEmpty(): SolidBoolean {
		return SolidBoolean.fromBoolean(this.codeunits.length === 0);
	}
	/** @override SolidObject */
	protected identical_helper(value: SolidObject): boolean {
		return value instanceof SolidString && xjs.Array.is(this.codeunits, value.codeunits);
	}
}
