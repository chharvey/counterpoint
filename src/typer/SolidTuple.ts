import type {SolidType} from './SolidType.js';
import {SolidTypeConstant} from './SolidTypeUnit.js';
import {SolidTypeTuple} from './SolidTypeTuple.js';
import type {SolidObject} from './SolidObject.js';
import {CollectionIndexed} from './CollectionIndexed.js';



export class SolidTuple<T extends SolidObject = SolidObject> extends CollectionIndexed<T> {
	static override toString(): string {
		return 'Tuple';
	}
	static override values: SolidType['values'] = new Set([new SolidTuple()]);

	override toType(): SolidTypeTuple {
		return SolidTypeTuple.fromTypes(this.items.map((it) => new SolidTypeConstant(it)));
	}
}
