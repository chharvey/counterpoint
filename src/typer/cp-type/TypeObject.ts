import {
	strictEqual,
	memoizeBinOp,
} from '../../lib/index.js';
import * as OBJ from '../cp-object/index.js';
import {subtypeDeco} from './decorators.js';
import {Type} from './Type.js';



/**
 * Class for constructing the `Object` type.
 * @final
 */
export class TypeObject extends Type {
	public static readonly INSTANCE = new TypeObject();


	private constructor() {
		super(false, new Set([
			new OBJ.List(),
			new OBJ.Dict(),
			new OBJ.Set(),
			new OBJ.Map(),
		]));
	}

	public override toString(): string {
		return 'Object';
	}

	public override includes(v: OBJ.Value): boolean {
		return (
			v instanceof OBJ.List ||
			v instanceof OBJ.Dict ||
			v instanceof OBJ.Set  ||
			v instanceof OBJ.Map
		);
	}

	@strictEqual
	@memoizeBinOp()
	@subtypeDeco
	public override isSubtypeOf(_t: Type): boolean {
		return false;
	}
}
