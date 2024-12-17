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
			OBJ.Null.NULL,
			OBJ.Boolean.FALSE,
			OBJ.Boolean.TRUE,
			OBJ.Integer.ZERO,
			new OBJ.Float(0.0),
			new OBJ.String(''),
			new OBJ.Tuple(),
			new OBJ.Record(),
			new OBJ.List(),
			new OBJ.Dict(),
			new OBJ.Set(),
			new OBJ.Map(),
		]));
	}

	public override toString(): string {
		return 'Object';
	}

	public override includes(_v: OBJ.Object): boolean {
		return true;
	}

	@strictEqual
	@memoizeBinOp()
	@subtypeDeco
	public override isSubtypeOf(_t: Type): boolean {
		return false;
	}
}
