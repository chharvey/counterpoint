import type * as OBJ from '../cp-object/index.js';
import {Type} from './Type.js';



/**
 * Class for constructing the `Object` type.
 * @final
 */
export class TypeObject extends Type {
	public static readonly INSTANCE = new TypeObject();


	private constructor() {
		super(false);
	}

	public override toString(): string {
		return 'Object';
	}

	public override includes(_v: OBJ.Object): boolean {
		return true;
	}
}
