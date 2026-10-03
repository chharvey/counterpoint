import {
	type CplConfig,
	CONFIG_DEFAULT,
} from '../../../core/index.ts';
import type {TYPE} from '../../../typer/index.ts';
import {STMT} from '../index.ts';
import {AstNode} from '../AstNode.ts';
import {
	Constant,
	TypeAlias,
	Tuple,
	Record,
	List,
	Dict,
	Set,
	Map,
	Access,
	Call,
	OperationUnary,
	OperationBinary,
} from './index.ts';



export abstract class TypeVisitor<T> {
	/* eslint-disable @stylistic/space-before-function-paren */
	public visitConstant        (typenode: Constant):        T { return this.defaultVisit(typenode); }
	public visitTypeAlias       (typenode: TypeAlias):       T { return this.defaultVisit(typenode); }
	public visitTuple           (typenode: Tuple):           T { return this.defaultVisit(typenode); }
	public visitRecord          (typenode: Record):          T { return this.defaultVisit(typenode); }
	public visitList            (typenode: List):            T { return this.defaultVisit(typenode); }
	public visitDict            (typenode: Dict):            T { return this.defaultVisit(typenode); }
	public visitSet             (typenode: Set):             T { return this.defaultVisit(typenode); }
	public visitMap             (typenode: Map):             T { return this.defaultVisit(typenode); }
	public visitAccess          (typenode: Access):          T { return this.defaultVisit(typenode); }
	public visitCall            (typenode: Call):            T { return this.defaultVisit(typenode); }
	public visitOperationUnary  (typenode: OperationUnary):  T { return this.defaultVisit(typenode); }
	public visitOperationBinary (typenode: OperationBinary): T { return this.defaultVisit(typenode); }
	/* eslint-enable @stylistic/space-before-function-paren */

	public abstract defaultVisit(typenode: Type): T;

	/** @final */
	public visit(typenode: Type): T {
		switch (typenode.constructor) {
			case Constant:        { return this.visitConstant        (typenode as Constant); } // eslint-disable-line @typescript-eslint/no-unnecessary-type-assertion
			case TypeAlias:       { return this.visitTypeAlias       (typenode as TypeAlias); }
			case Tuple:           { return this.visitTuple           (typenode as Tuple); }
			case Record:          { return this.visitRecord          (typenode as Record); }
			case List:            { return this.visitList            (typenode as List); }
			case Dict:            { return this.visitDict            (typenode as Dict); }
			case Set:             { return this.visitSet             (typenode as Set); }
			case Map:             { return this.visitMap             (typenode as Map); }
			case Access:          { return this.visitAccess          (typenode as Access); }
			case Call:            { return this.visitCall            (typenode as Call); }
			case OperationUnary:  { return this.visitOperationUnary  (typenode as OperationUnary); }
			case OperationBinary: { return this.visitOperationBinary (typenode as OperationBinary); }

			default: { return this.defaultVisit(typenode); }
		}
	}
}



/**
 * A sematic node representing a type expression.
 * Known subclasses:
 * - Constant
 * - TypeAlias
 * - Collection
 * - Access
 * - Call
 * - Operation
 */
export abstract class Type extends AstNode {
	/**
	 * Construct a new Type from a source text and optionally a configuration.
	 * The source text must parse successfully.
	 * @param src    the source text
	 * @param config the configuration
	 * @returns      a new Type representing the given source
	 */
	public static fromSource(src: string, config: CplConfig = CONFIG_DEFAULT): Type {
		const statement: STMT.DeclarationType = STMT.DeclarationType.fromSource(`type T = ${ src };`, config);
		return statement.assigned;
	}

	/**
	 * @final
	 */
	public override typeCheck(): void {
		super.typeCheck();
		this.eval(); // assert does not throw
	}

	/**
	 * Assess the type-value of this node at compile-time.
	 * @returns the computed type-value of this node
	 */
	public abstract eval(): TYPE.Type;
}
