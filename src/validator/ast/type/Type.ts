import * as assert from 'node:assert';
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



interface TypeVisitorMethods<T> {
	visitConstant        (typenode: Constant):        T;
	visitTypeAlias       (typenode: TypeAlias):       T;
	visitTuple           (typenode: Tuple):           T;
	visitRecord          (typenode: Record):          T;
	visitList            (typenode: List):            T;
	visitDict            (typenode: Dict):            T;
	visitSet             (typenode: Set):             T;
	visitMap             (typenode: Map):             T;
	visitAccess          (typenode: Access):          T;
	visitCall            (typenode: Call):            T;
	visitOperationUnary  (typenode: OperationUnary):  T;
	visitOperationBinary (typenode: OperationBinary): T;

	defaultVisit(typenode: Type): T;
}
export class TypeVisitor<T> {
	public constructor(private readonly methods: Partial<TypeVisitorMethods<T>>) {}

	/** @final */
	public visit(typenode: Type): T {
		switch (typenode.constructor) {
			case Constant:        { return this.methods.visitConstant        ?.(typenode as Constant)        ?? this.methods.defaultVisit?.(typenode) ?? assert.fail('Missing implementation.'); } // eslint-disable-line @typescript-eslint/no-unnecessary-type-assertion
			case TypeAlias:       { return this.methods.visitTypeAlias       ?.(typenode as TypeAlias)       ?? this.methods.defaultVisit?.(typenode) ?? assert.fail('Missing implementation.'); }
			case Tuple:           { return this.methods.visitTuple           ?.(typenode as Tuple)           ?? this.methods.defaultVisit?.(typenode) ?? assert.fail('Missing implementation.'); }
			case Record:          { return this.methods.visitRecord          ?.(typenode as Record)          ?? this.methods.defaultVisit?.(typenode) ?? assert.fail('Missing implementation.'); }
			case List:            { return this.methods.visitList            ?.(typenode as List)            ?? this.methods.defaultVisit?.(typenode) ?? assert.fail('Missing implementation.'); }
			case Dict:            { return this.methods.visitDict            ?.(typenode as Dict)            ?? this.methods.defaultVisit?.(typenode) ?? assert.fail('Missing implementation.'); }
			case Set:             { return this.methods.visitSet             ?.(typenode as Set)             ?? this.methods.defaultVisit?.(typenode) ?? assert.fail('Missing implementation.'); }
			case Map:             { return this.methods.visitMap             ?.(typenode as Map)             ?? this.methods.defaultVisit?.(typenode) ?? assert.fail('Missing implementation.'); }
			case Access:          { return this.methods.visitAccess          ?.(typenode as Access)          ?? this.methods.defaultVisit?.(typenode) ?? assert.fail('Missing implementation.'); }
			case Call:            { return this.methods.visitCall            ?.(typenode as Call)            ?? this.methods.defaultVisit?.(typenode) ?? assert.fail('Missing implementation.'); }
			case OperationUnary:  { return this.methods.visitOperationUnary  ?.(typenode as OperationUnary)  ?? this.methods.defaultVisit?.(typenode) ?? assert.fail('Missing implementation.'); }
			case OperationBinary: { return this.methods.visitOperationBinary ?.(typenode as OperationBinary) ?? this.methods.defaultVisit?.(typenode) ?? assert.fail('Missing implementation.'); }
			default:              { return                                                                      this.methods.defaultVisit?.(typenode) ?? assert.fail('Unexpected subclass.'); }
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
