import * as assert from 'node:assert';
import type * as binaryen from 'binaryen.ts';
import type {CodeGenerator} from '../../index.ts';
import {
	assert_instanceof,
	memoizeMethod,
	runOnceMethod,
} from '../../lib/index.ts';
import {
	VALUE,
	TYPE,
} from '../../typer/index.ts';
import type {Builder} from '../Builder.ts';
import type {Interpreter} from '../Interpreter.ts';
import {OpCode} from './Opcode.ts';
import {Value} from './Value.ts';
import type {ValueTac} from './ValueTac.ts';



/**
 * Create a new reference Object.
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
		private readonly isClass: boolean,
		private readonly class_?: ValueTac,
	) {
		super(OpCode.OBJECT_NEW, isClass ? TYPE.CLASS : TYPE.OBJ);
	}


	public override toString(): string {
		return super.toString(this.isClass ? '<Class>' : '', this.class_ ?? '');
	}

	@runOnceMethod
	public override validate(builder: Builder): void {
		assert.ok(!!this.class_ || this.isClass);
		assert.ok(this.class_?.type.isSubtypeOf(TYPE.CLASS) ?? true);
		return this.class_?.validate(builder);
	}

	public override interpret(interp: Interpreter): VALUE.Object {
		const class_: VALUE.Value | undefined = this.class_?.interpret(interp);
		class_ && assert_instanceof(class_, VALUE.Class);
		return this.isClass
			? new VALUE.Class(class_ ? TYPE.OBJ : TYPE.CLASS, class_ as VALUE.Class | undefined)
			: new VALUE.Object(0n, class_ as VALUE.Class);
	}

	@memoizeMethod
	public override codegen(cg: CodeGenerator): binaryen.ExpressionRef {
		const class_: binaryen.ExpressionRef /* (ref $Class) */ | undefined = this.class_ && cg.vm.Value.asClass(this.class_.codegen(cg));
		return cg.vm.Value.newComposite(this.isClass ? cg.codegenClass(class_) : cg.codegenObject(class_!));
	}
}
