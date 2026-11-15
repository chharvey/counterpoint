import type * as binaryen from 'binaryen.ts';
import type {CodeGenerator} from '../../index.ts';
import {memoizeMethod} from '../../lib/index.ts';
import {TYPE} from '../../typer/index.ts';
import {OpCode} from './Opcode.ts';
import {Value} from './Value.ts';
import type {ValueTac} from './ValueTac.ts';



/**
 * Create a new reference Object.
 * @deprecated
 */
export class ObjectNew extends Value {
	/**
	 * Construct a new ObjectNew object.
	 *
	 * If `is_class` is false, this represents a regular reference object with a constructor: the given `class_`.
	 *
	 * If `is_class` is true and `class_` is not given, this represents the class named `Class` and its constructor is itself.
	 *
	 * If `is_class` is true and `class_` is given, this represents a class that is an instance of `class_`;
	 * in that case, the given `class_` must be a “metaclass” — either the `Class` class or an extension of it.
	 *
	 * @param is_class Is this object a class?
	 * @param class_   the constructor of this object
	 */
	public constructor(is_class: true);
	public constructor(is_class: boolean, class_: ValueTac);
	public constructor(
		public readonly isClass: boolean,
		public readonly class_?: ValueTac,
	) {
		super(OpCode.OBJECT_NEW, isClass ? TYPE.CLASS : TYPE.OBJ);
	}


	public override toString(): string {
		return super.toString(this.isClass ? '<Class>' : '', this.class_ ?? '');
	}

	@memoizeMethod
	public override codegen(cg: CodeGenerator): binaryen.ExpressionRef {
		const class_: binaryen.ExpressionRef /* (ref $Class) */ | undefined = this.class_ && cg.mod.wasm.ref.cast(this.class_.codegen(cg), cg.vm.reftype.Class);
		return this.isClass ? cg.codegenClass(class_) : cg.codegenObject(class_!);
	}
}
