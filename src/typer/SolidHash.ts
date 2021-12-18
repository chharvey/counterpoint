import {SolidType} from './SolidType.js';
import {SolidTypeUnit} from './SolidTypeUnit.js';
import {SolidTypeHash} from './SolidTypeHash.js';
import type {SolidObject} from './SolidObject.js';
import {CollectionKeyed} from './CollectionKeyed.js';



export class SolidHash<T extends SolidObject = SolidObject> extends CollectionKeyed<T> {
	override toString(): string {
		return `${ SolidHash/*static*/ }.(${ super.toString() })`;
	}
	override toType(): SolidTypeHash {
		return new SolidTypeHash(
			(this.properties.size)
				? SolidType.unionAll([...this.properties.values()].map<SolidType>((value) => new SolidTypeUnit(value)))
				: SolidType.NEVER,
		);
	}
}
