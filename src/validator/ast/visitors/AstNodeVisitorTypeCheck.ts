import * as assert from 'node:assert';
import * as xjs from 'extrajs';
import {
	AssignmentErrorMissingType,
	AssignmentErrorFunctionExit,
	TypeError as CplTypeError,
	TypeErrorInvalidOperation,
	TypeErrorNotNarrow,
	TypeErrorNotAssignable,
	TypeErrorAmbiguousOverload,
	MutabilityError01,
} from '../../../index.ts';
import {assert_instanceof} from '../../../lib/index.ts';
import {
	VALUE,
	TYPE,
} from '../../../typer/index.ts';
import type {
	SymbolSchemaType,
	SymbolSchemaVar,
	SymbolSchemaFunc,
} from '../../index.ts';
import {get_entry_info} from '../utils-private.ts';
import {CompletionKind} from '../CompletionKind.ts';
import {
	typecheck_assign,
	AstNodeVisitor,
	type AstNode,
} from '../AstNode.ts';
import {
	type Functionlike,
	is_Functionlike,
} from '../Functionlike.ts';
import {Index} from '../Index-.ts';
import {Key} from '../Key.ts';
import type {ParameterFunction} from '../ParameterFunction.ts';
import type {Capture} from '../Capture.ts';
import type {Block} from '../Block.ts';
import * as AST_TYPE from '../type/index.ts';
import * as EXPR from '../expression/index.ts';
import type * as STMT from '../statement/index.ts';
import {AstNodeVisitorCompletion} from './AstNodeVisitorCompletion.ts';
import {TypeVisitorTypevalue} from './TypeVisitorTypevalue.ts';
import {ExprVisitorType} from './ExprVisitorType.ts';



export class AstNodeVisitorTypeCheck extends AstNodeVisitor<void> {
	readonly #astNodeVisitorCompletion = new AstNodeVisitorCompletion();
	readonly #typeVisitorTypevalue     = new TypeVisitorTypevalue();
	readonly #exprVisitorType          = new ExprVisitorType();


	public override visitParameterFunction(node: ParameterFunction): void {
		this.defaultVisit(node);
		const param_type: TYPE.Type = this.#typeVisitorTypevalue.visit(node.typenode);
		node.expr && typecheck_assign(this.#exprVisitorType, node.expr, param_type, node);
		if (node.identifier) {
			const block: Block = (node.parent as Functionlike).block;
			assert.ok(block.validator.hasSymbol(node.id!), `The validator symbol table should include ${node.id}.`);
			(block.validator.getSymbol(node.id!) as SymbolSchemaVar).type = param_type;
		}
	}

	public override visitCapture(node: Capture): void {
		this.defaultVisit(node);
		if (!node.ref) {
			((node.parent as Functionlike).block.validator.getSymbol(node.variable.id) as SymbolSchemaVar).type = this.#exprVisitorType.visit(node.variable)!; // variables will never be void
		}
	}

	public override visitBlock(node: Block): void {
		this.defaultVisit(node);
		if (node.parent && is_Functionlike(node.parent) && this.#astNodeVisitorCompletion.visit(node) !== CompletionKind.RETURN_OR_PANIC) {
			throw new AssignmentErrorFunctionExit(node.parent);
		}
	}

	/* eslint-disable @stylistic/space-before-function-paren */
	public override visitTypeConstant        (typenode: AST_TYPE.Constant):        void { return this.visitType(typenode); }
	public override visitTypeAlias           (typenode: AST_TYPE.TypeAlias):       void { return this.visitType(typenode); }
	public override visitTypeTuple           (typenode: AST_TYPE.Tuple):           void { return this.visitType(typenode); }
	public override visitTypeRecord          (typenode: AST_TYPE.Record):          void { return this.visitType(typenode); }
	public override visitTypeList            (typenode: AST_TYPE.List):            void { return this.visitType(typenode); }
	public override visitTypeDict            (typenode: AST_TYPE.Dict):            void { return this.visitType(typenode); }
	public override visitTypeSet             (typenode: AST_TYPE.Set):             void { return this.visitType(typenode); }
	public override visitTypeMap             (typenode: AST_TYPE.Map):             void { return this.visitType(typenode); }
	public override visitTypeAccess          (typenode: AST_TYPE.Access):          void { return this.visitType(typenode); }

	public override visitTypeCall(typenode: AST_TYPE.Call): void {
		if (!(typenode.base instanceof AST_TYPE.TypeAlias && typenode.base.isTypefuncRef)) {
			return this.visit(typenode.base);
		}
		xjs.Array.forEachAggregated(typenode.args, (arg) => this.visit(arg));
		this.#typeVisitorTypevalue.visit(typenode);
	}

	public override visitTypeOperationUnary  (typenode: AST_TYPE.OperationUnary):  void { return this.visitType(typenode); }
	public override visitTypeOperationBinary (typenode: AST_TYPE.OperationBinary): void { return this.visitType(typenode); }
	public override visitTypeFunction        (typenode: AST_TYPE.Function):        void { return this.visitType(typenode); }
	/* eslint-enable @stylistic/space-before-function-paren */

	public override visitType(typenode: AST_TYPE.Type): void {
		this.defaultVisit(typenode);
		this.#typeVisitorTypevalue.visit(typenode);
	}

	/* eslint-disable @stylistic/space-before-function-paren */
	public override visitExprConstant (expr: EXPR.Constant):        void { return this.visitExpression(expr); }
	public override visitTemplate     (expr: EXPR.Template):        void { return this.visitExpression(expr); }
	public override visitVariable     (expr: EXPR.Variable):        void { return this.visitExpression(expr); }
	public override visitExprTuple    (expr: EXPR.Tuple):           void { return this.visitExpression(expr); }
	public override visitExprRecord   (expr: EXPR.Record):          void { return this.visitExpression(expr); }
	public override visitExprList     (expr: EXPR.List):            void { return this.visitExpression(expr); }
	public override visitExprDict     (expr: EXPR.Dict):            void { return this.visitExpression(expr); }
	public override visitExprSet      (expr: EXPR.Set):             void { return this.visitExpression(expr); }
	public override visitExprMap      (expr: EXPR.Map):             void { return this.visitExpression(expr); }
	public override visitExprBlock    (expr: EXPR.ExpressionBlock): void { return this.visitExpression(expr); }
	public override visitExprAccess   (expr: EXPR.Access):          void { return this.visitExpression(expr); }

	public override visitExprCall(expr: EXPR.Call): void {
		if (!(expr.base instanceof EXPR.Variable && expr.base.isFuncRef)) {
			return this.visit(expr.base);
		}
		xjs.Array.forEachAggregated([
			...expr.typeargs,
			...expr.exprargsPosit,
			...expr.exprargsNamed,
		], (arg) => this.visit(arg));
		this.#exprVisitorType.visit(expr);
	}

	public override visitExprClaim                      (expr: EXPR.Claim):                      void { return this.visitExpression(expr); }
	public override visitOperationExprUnary             (expr: EXPR.OperationUnary):             void { return this.visitExpression(expr); }
	public override visitOperationExprBinaryCast        (expr: EXPR.OperationBinaryCast):        void { return this.visitExpression(expr); }
	public override visitOperationExprBinaryArithmetic  (expr: EXPR.OperationBinaryArithmetic):  void { return this.visitExpression(expr); }
	public override visitOperationExprBinaryComparative (expr: EXPR.OperationBinaryComparative): void { return this.visitExpression(expr); }
	public override visitOperationExprBinaryEquality    (expr: EXPR.OperationBinaryEquality):    void { return this.visitExpression(expr); }
	public override visitOperationExprBinaryLogical     (expr: EXPR.OperationBinaryLogical):     void { return this.visitExpression(expr); }
	public override visitOperationExprTernary           (expr: EXPR.OperationTernary):           void { return this.visitExpression(expr); }
	public override visitSwitch                         (expr: EXPR.Switch):                     void { return this.visitExpression(expr); }
	public override visitExprFunction                   (expr: EXPR.Function):                   void { return this.visitExpression(expr); }
	/* eslint-enable @stylistic/space-before-function-paren */

	public override visitExpression(expr: EXPR.Expression): void {
		this.defaultVisit(expr);
		this.#exprVisitorType.visit(expr);
	}

	public override visitDeclType(stmt: STMT.DeclarationType): void {
		const typevalue: TYPE.Type = this.#typeVisitorTypevalue.visit(stmt.assigned); // evaluate first before checking, to rethrow any errors
		if (stmt.assignee) {
			assert.ok(stmt.validator.hasSymbol(stmt.id!), `The validator symbol table should include ${stmt.id}.`);
			const symbol = stmt.validator.getSymbol(stmt.id!) as SymbolSchemaType;
			symbol.typevalue = typevalue;
		}
	}

	public override visitDeclVariable(stmt: STMT.DeclarationVariable): void {
		this.defaultVisit(stmt);
		if (!stmt.typenode && !this.#isExprInferrable(stmt.assigned ?? undefined)) {
			throw new AssignmentErrorMissingType(stmt);
		}
		const assignee_type: TYPE.Type = stmt.typenode ? this.#typeVisitorTypevalue.visit(stmt.typenode) : (
			stmt.writable && ([
				EXPR.Constant,
				EXPR.Tuple,
				EXPR.Record,
			].some((klass) => stmt.assigned instanceof klass)) ? this.#writableInferredType(stmt.assigned!)! : // constants/tuples/records will never be void
			stmt.assigned instanceof EXPR.Template ? TYPE.STR :
			this.#exprVisitorType.throwIfVoid(stmt.assigned!)
		);
		stmt.assigned && typecheck_assign(this.#exprVisitorType, stmt.assigned, assignee_type, stmt);
		if (stmt.assignee) {
			assert.ok(stmt.validator.hasSymbol(stmt.id!), `The validator symbol table should include ${stmt.id}.`);
			(stmt.validator.getSymbol(stmt.id!) as SymbolSchemaVar).type = assignee_type;
		}
	}

	public override visitDeclFunction(stmt: STMT.DeclarationFunction): void {
		this.defaultVisit(stmt);
		const fn_type: TYPE.Type = this.#exprVisitorType.visitFunctionlike(stmt);
		assert_instanceof(fn_type, TYPE.Function);
		if (stmt.identifier) {
			assert.ok(stmt.validator.hasSymbol(stmt.id!), `The validator symbol table should include ${stmt.id}.`);
			const schema = stmt.validator.getSymbol(stmt.id!) as SymbolSchemaFunc;
			if (schema.types.find((t) => fn_type === t || fn_type.isMoreSpecificThan(t) && t.isMoreSpecificThan(fn_type))) {
				// if there exists an identically-typed overload, as static dispatch won’t know which one to choose
				throw new TypeErrorAmbiguousOverload(stmt);
			} else {
				schema.types.push(fn_type);
			}
		}
	}

	public override visitStmtClaim(stmt: STMT.StatementClaim): void {
		this.defaultVisit(stmt);
		const computed_type: TYPE.Type = this.#exprVisitorType.throwIfVoid(stmt.assignee);
		const claimed_type:  TYPE.Type = this.#typeVisitorTypevalue.visit(stmt.claimed_type);
		/* Type claim statements can only narrow the expression’s type. */
		if (!claimed_type.isSubtypeOf(computed_type)) {
			throw new TypeErrorNotNarrow(claimed_type, computed_type, stmt.line_index, stmt.col_index);
		}
		if (stmt.assignee instanceof EXPR.Variable) {
			const symbol = stmt.validator.getSymbol(stmt.assignee.id) as SymbolSchemaVar | undefined;
			if (symbol) {
				symbol.type = claimed_type;
			}
		} else {
			assert_instanceof(stmt.assignee, EXPR.Access);
			const base_type: TYPE.Type = this.#exprVisitorType.throwIfVoid(stmt.assignee.base, new TypeErrorInvalidOperation(stmt.assignee));
			const {accessor} = stmt.assignee;
			switch (true) {
				case base_type instanceof TYPE.Tuple: {
					assert_instanceof(accessor, Index);
					return base_type.set(accessor.index, claimed_type, accessor);
				}
				case base_type instanceof TYPE.Record: {
					assert_instanceof(accessor, Key);
					return base_type.set(accessor.id, claimed_type, accessor);
				}
				default: {
					assert_instanceof(accessor, EXPR.Expression);
					throw new Error('`TypeCheck(StatementClaim[assignee: Access[accessor: Expression]])` not yet supported.');
				}
			}
		}
	}

	public override visitStmtReassignment(stmt: STMT.StatementReassignment): void {
		this.defaultVisit(stmt);
		let write_type: TYPE.Type;
		if (stmt.assignee instanceof EXPR.Variable) {
			write_type = (stmt.assignee.validator.getSymbol(stmt.assignee.id) as SymbolSchemaVar).type;
		} else {
			assert_instanceof(stmt.assignee, EXPR.Access);
			const base_type: TYPE.Type = this.#exprVisitorType.throwIfVoid(stmt.assignee.base);
			if (!base_type.isMutable) {
				throw new MutabilityError01(base_type, stmt);
			}
			if (!stmt.assigned && !(base_type instanceof TYPE.TypeInterface)) {
				throw new CplTypeError('The `delete` statement is only applicable to interface types.');
			}
			write_type = get_entry_info(base_type, stmt.assignee, true).type;
		}
		stmt.assigned && typecheck_assign(this.#exprVisitorType, stmt.assigned, write_type, stmt);
	}

	public override visitStmtConditional(stmt: STMT.StatementConditional): void {
		this.defaultVisit(stmt);
		if (!this.#exprVisitorType.throwIfVoid(stmt.condition).isSubtypeOf(TYPE.BOOL)) {
			throw new TypeErrorNotAssignable(stmt.condition, TYPE.BOOL);
		}
	}

	public override visitStmtLoop(stmt: STMT.StatementLoop): void {
		this.defaultVisit(stmt);
		if (!this.#exprVisitorType.throwIfVoid(stmt.condition).isSubtypeOf(TYPE.BOOL)) {
			throw new TypeErrorNotAssignable(stmt.condition, TYPE.BOOL);
		}
	}

	public override visitStmtIteration(stmt: STMT.StatementIteration): void {
		const assignee_type: TYPE.Type = this.#typeVisitorTypevalue.visit(stmt.typenode);
		const iterable_type: TYPE.Type = this.#exprVisitorType.throwIfVoid(stmt.iterable);
		if (!(iterable_type instanceof TYPE.List)) {
			throw new TypeErrorNotAssignable(stmt.iterable, new TYPE.List(TYPE.ANYTHING));
		}
		if (!iterable_type.typearg.isSubtypeOf(assignee_type)) {
			throw new TypeErrorNotNarrow(iterable_type.typearg, assignee_type, stmt.line_index, stmt.col_index);
		}
		if (stmt.assignee) {
			assert.ok(stmt.block.validator.hasSymbol(stmt.id!), `The validator symbol table should include ${stmt.id}.`);
			(stmt.block.validator.getSymbol(stmt.id!) as SymbolSchemaVar).type = assignee_type;
		}
		return this.visit(stmt.block);
	}

	public override visitStmtReturn(stmt: STMT.StatementReturn): void {
		this.defaultVisit(stmt);
		if (stmt.panic) {
			return typecheck_assign(this.#exprVisitorType, stmt.expression!, TYPE.EXCP, stmt);
		}
		let parent: AstNode | undefined = stmt.parent;
		while (parent && !is_Functionlike(parent)) {
			parent = parent.parent;
		}
		if (!parent) {
			return;
		}
		const return_type: TYPE.Type | undefined = parent.returnType ? this.#typeVisitorTypevalue.visit(parent.returnType) : undefined;
		if (stmt.expression) {
			if (return_type) {
				return typecheck_assign(this.#exprVisitorType, stmt.expression, return_type, stmt);
			} else if (this.#exprVisitorType.visit(stmt.expression)) {
				throw new Error(`Non-void expression \`${stmt.expression.source}\` is returned from a void function.`); // TODO: create new TypeError subclass
			}
			// else, tail calls of void expressions are allowed
		} else if (return_type) {
			throw new Error(`A function with return type \`${return_type}\` does not return a value.`); // TODO: create new TypeError subclass
		}
	}

	public override defaultVisit(node: AstNode): void {
		return xjs.Array.forEachAggregated(node.children, (c) => this.visit(c));
	}

	#isExprInferrable(node?: EXPR.Expression): boolean {
		return (
			[
				EXPR.Constant,
				EXPR.Template,
				EXPR.Call, // TODO: distinguish between constructor calls and function calls
			].some((klass) => node instanceof klass) ? true :
			node instanceof EXPR.Tuple  ? node.children.every((expr) => this.#isExprInferrable(expr)) :
			node instanceof EXPR.Record ? node.children.every((prop) => this.#isExprInferrable(prop.val)) :
			false
		);
	}

	#writableInferredType(expression: EXPR.Expression): TYPE.Type | null {
		const err = new CplTypeError('Expression of type `void` is not a value.'); // TODO: new class of CplTypeError
		switch (true) {
			case expression instanceof EXPR.Constant: {
				const value: VALUE.Primitive = expression.interpreterValue;
				return (
					value instanceof VALUE.Null    ? TYPE.NULL :
					value instanceof VALUE.Boolean ? TYPE.BOOL :
					value instanceof VALUE.Symbol  ? TYPE.SYM :
					value instanceof VALUE.Integer ? TYPE.INT :
					value instanceof VALUE.Natural ? TYPE.NAT :
					value instanceof VALUE.Float   ? TYPE.FLOAT :
					value instanceof VALUE.String  ? TYPE.STR :
					assert.fail(`Expected ${value} to be a primitive value.`)
				);
			}
			case expression instanceof EXPR.Tuple: {
				return TYPE.Tuple.fromTypes(expression.children.map((expr) => this.#writableInferredType(expr) ?? assert.fail(err)));
			}
			case expression instanceof EXPR.Record: {
				return TYPE.Record.fromTypes(new Map(expression.children.map((prop) => [prop.key.id, this.#writableInferredType(prop.val) ?? assert.fail(err)])));
			}
			case expression instanceof EXPR.Call: { // TODO: distinguish between constructor calls and function calls
				return this.#exprVisitorType.visit(expression);
			}
			default: {
				assert.fail(`${expression.source} should be an instance of ${EXPR.Constant.name}, ${EXPR.Tuple.name}, ${EXPR.Record.name}, or ${EXPR.Call.name}.`);
			}
		}
	}
}
