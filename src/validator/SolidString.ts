import * as xjs from 'extrajs';
import * as utf8 from 'utf8';

import type {CodeUnit} from '../types';
import {SolidObject} from '../typer/SolidObject';
import {SolidBoolean} from './SolidBoolean';



export class SolidString extends SolidObject {
	static override toString(): string {
		return 'str';
	}
	private readonly codeunits: readonly CodeUnit[];
	constructor (data: string | readonly CodeUnit[]) {
		super();
		this.codeunits = (typeof data === 'string')
			? [...utf8.encode(data)].map((ch) => ch.codePointAt(0)!)
			: data
	}

	override get isEmpty(): SolidBoolean {
		return SolidBoolean.fromBoolean(this.codeunits.length === 0);
	}
	override toString(): string {
		return utf8.decode(String.fromCodePoint(...this.codeunits));
	}
	protected override identical_helper(value: SolidObject): boolean {
		return value instanceof SolidString && xjs.Array.is(this.codeunits, value.codeunits);
	}
}
