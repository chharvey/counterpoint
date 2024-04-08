import type * as OBJ from '../cp-object/index.js';
import {Type} from './Type.js';



/**
 * Known subclasses:
 * - TypeIntersection
 * - TypeUnion
 */
export abstract class Combinable extends Type {
	/**
	 * Construct a new Combinable object.
	 * @param values the values assignable to this type
	 */
	public constructor(
		values: ReadonlySet<OBJ.Object>,
		public readonly operands: readonly [Type, Type, ...readonly Type[]],
	) {
		super(false, values);
	}


	public abstract combineTuplesOrRecords(): Type;
}
