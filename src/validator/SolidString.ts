import * as xjs from 'extrajs';
import * as utf8 from 'utf8';

import type {SolidLanguageType} from './SolidLanguageType';
import type {CodeUnit} from '../types';
import {
	strictEqual,
} from '../decorators';
import {SolidObject} from './SolidObject';
import {SolidBoolean} from './SolidBoolean';



export class SolidString extends SolidObject {
	/** @implements Object */
	static toString(): string {
		return 'str';
	}
	/** @overrides SolidObject */
	static values: SolidLanguageType['values'] = new Set([new SolidString('')]);


	private readonly codeunits: readonly CodeUnit[];
	constructor (data: string | readonly CodeUnit[]) {
		super();
		this.codeunits = (typeof data === 'string')
			? [...utf8.encode(data)].map((ch) => ch.codePointAt(0)!)
			: data
	}

	/** @override SolidObject */
	get isEmpty(): SolidBoolean {
		return SolidBoolean.fromBoolean(this.codeunits.length === 0);
	}
	/** @override Object */
	toString(): string {
		return utf8.decode(String.fromCodePoint(...this.codeunits));
	}
	/** @override SolidObject */
	@strictEqual
	identical(value: SolidObject): boolean {
		return value instanceof SolidString && xjs.Array.is(this.codeunits, value.codeunits);
	}
}
