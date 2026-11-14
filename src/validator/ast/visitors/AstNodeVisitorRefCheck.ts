import * as assert from 'node:assert';
import * as xjs from 'extrajs';
import {
	ReferenceErrorUndeclared,
	ReferenceErrorKind,
	AssignmentErrorDuplicateDeclaration,
	AssignmentErrorDuplicateKey,
	AssignmentErrorReassignment,
	AssignmentErrorDeletion,
} from '../../../index.ts';
import {CoreLibName} from '../../../parser/index.ts';
import {
	SymbolKind,
	type SymbolSchema,
	SymbolSchemaType,
	SymbolSchemaVar,
	SymbolSchemaFunc,
} from '../../index.ts';
import {validate_callable_interface_name} from '../utils-private.ts';
import {
	AstNodeVisitor,
	type AstNode,
} from '../AstNode.ts';
import type {Functionlike} from '../Functionlike.ts';
import type {Key} from '../Key.ts';
import type {ParameterFunction} from '../ParameterFunction.ts';
import type {Capture} from '../Capture.ts';
import type {Block} from '../Block.ts';
import type * as AST_TYPE from '../type/index.ts';
import * as EXPR from '../expression/index.ts';
import * as STMT from '../statement/index.ts';



/** Ensure no duplicate keys in a record/dict expression/type or function type. */
export function check_unique_keys(keys: readonly Key[]): void {
	const key_ids = new Set<bigint>();
	return xjs.Array.forEachAggregated(keys, (key) => {
		if (key_ids.has(key.id)) {
			throw new AssignmentErrorDuplicateKey(key);
		} else {
			key_ids.add(key.id);
		}
	});
}



/**
 * A visitor to perform definite assignment phase of semantic analysis:
 * - Check that all variables have been assigned before being used.
 * - Check that no variable or key is declared more than once.
 * - Check that read-only variables are not reassigned.
 */
export class AstNodeVisitorRefCheck extends AstNodeVisitor<void> {
	public override visitParameterFunction(node: ParameterFunction): void {
		this.defaultVisit(node);
		if (node.identifier) {
			const block: Block = (node.parent as Functionlike).block;
			if (block.validator.hasSymbol(node.id!)) {
				throw new AssignmentErrorDuplicateDeclaration(node.identifier);
			}
			block.validator.addSymbol(new SymbolSchemaVar(node.id!, node.identifier, node.writable, node.optional && !node.expr));
		}
	}

	public override visitCapture(node: Capture): void {
		this.defaultVisit(node);
		const schema = node.validator.getSymbol(node.variable.id) as SymbolSchemaVar;
		(node.parent as Functionlike).block.validator.addSymbol(node.ref ? schema : new SymbolSchemaVar(
			schema.id,
			node.variable,
			schema.isWritable && node.ref,
			schema.isUninitialized,
		));
	}

	public override visitBlock(node: Block): void {
		xjs.Array.forEachAggregated(node.children.filter((stmt) => stmt instanceof STMT.DeclarationFunction), (fn) => this.#hoistFuncDecl(fn));
		return this.defaultVisit(node);
	}

	public override visitTypeAlias(typenode: AST_TYPE.TypeAlias): void {
		// NOTE: ignore ref-checking `this` for now if source is a built-in identifier, as semantics is determined by syntax.
		if (([
			CoreLibName.OBJECT,
			CoreLibName.EXCEPTION,
			CoreLibName.FUNCTION,
			CoreLibName.CLASS,
		] as readonly string[]).includes(typenode.source)) {
			return;
		}
		if (!typenode.validator.hasSymbol(typenode.id)) {
			throw new ReferenceErrorUndeclared(typenode);
		}
		if (!(typenode.validator.getSymbol(typenode.id) instanceof SymbolSchemaType)) {
			throw new ReferenceErrorKind(typenode, SymbolKind.VALUE, SymbolKind.TYPE);
			// TODO: When Type objects are allowed as runtime values, this should be removed and checked by the type checker.
		}
	}

	public override visitTypeRecord(typenode: AST_TYPE.Record): void {
		check_unique_keys(typenode.children.map((prop) => prop.key));
		return this.defaultVisit(typenode);
	}

	public override visitTypeCall(typenode: AST_TYPE.Call): void {
		// NOTE: ignore ref-checking `this.base` for now, as semantics is determined by syntax.
		// (`this.base.source` must be a `CallableInterfaceName`)
		validate_callable_interface_name(typenode.base.source);
		return xjs.Array.forEachAggregated(typenode.args, (arg) => this.visit(arg));
	}

	public override visitTypeFunction(typenode: AST_TYPE.Function): void {
		check_unique_keys(typenode.paramNamedTypes.map((prop) => prop.key));
		return this.defaultVisit(typenode);
	}

	public override visitVariable(expr: EXPR.Variable): void {
		if (!expr.validator.hasSymbol(expr.id)) {
			throw new ReferenceErrorUndeclared(expr);
		}
		const symbol: SymbolSchema = expr.validator.getSymbol(expr.id)!;
		if (expr.validator.getSymbol(expr.id) instanceof SymbolSchemaType) {
			throw new ReferenceErrorKind(expr, SymbolKind.TYPE, SymbolKind.VALUE);
			// TODO: When Type objects are allowed as runtime values, this should be removed and checked by the type checker.
		}
		if (symbol instanceof SymbolSchemaFunc) {
			expr.isFuncRef = true;
			throw new ReferenceErrorKind(expr, SymbolKind.FUNC, SymbolKind.VALUE);
		}
	}

	public override visitExprRecord(expr: EXPR.Record): void {
		check_unique_keys(expr.children.map((prop) => prop.key));
		return this.defaultVisit(expr);
	}

	public override visitExprDict(expr: EXPR.Dict): void {
		check_unique_keys(expr.children.map((prop) => prop.key));
		return this.defaultVisit(expr);
	}

	public override visitExprCall(expr: EXPR.Call): void {
		try {
			this.visit(expr.base);
		} catch (err) {
			if (!(expr.base instanceof EXPR.Variable && expr.base.isFuncRef)) {
				throw err;
			}
		}
		return xjs.Array.forEachAggregated([
			...expr.typeargs,
			...expr.exprargsPosit,
			...expr.exprargsNamed,
		], (arg) => this.visit(arg));
	}

	public override visitExprFunction(expr: EXPR.Function): void {
		return this.visitFunctionlike(expr);
	}

	public override visitDeclType(stmt: STMT.DeclarationType): void {
		this.defaultVisit(stmt);
		if (stmt.assignee) {
			if (stmt.validator.hasSymbol(stmt.id!)) {
				throw new AssignmentErrorDuplicateDeclaration(stmt.assignee);
			}
			stmt.validator.addSymbol(new SymbolSchemaType(stmt.id!, stmt.assignee));
		}
	}

	public override visitDeclVariable(stmt: STMT.DeclarationVariable): void {
		this.defaultVisit(stmt);
		if (stmt.assignee) {
			if (stmt.validator.hasSymbol(stmt.id!)) {
				throw new AssignmentErrorDuplicateDeclaration(stmt.assignee);
			}
			stmt.validator.addSymbol(new SymbolSchemaVar(stmt.id!, stmt.assignee, stmt.writable, !stmt.assigned));
		}
	}

	public override visitDeclFunction(stmt: STMT.DeclarationFunction): void {
		this.#hoistFuncDecl(stmt);
		return this.visitFunctionlike(stmt);
	}

	public override visitStmtReassignment(stmt: STMT.StatementReassignment): void {
		this.defaultVisit(stmt); // runtime asserts the var is in the symbol table and is a SymbolSchemaVar
		if (stmt.assignee instanceof EXPR.Variable) {
			const schema = stmt.validator.getSymbol(stmt.assignee.id) as SymbolSchemaVar;
			if (stmt.assigned) {
				if (!schema.isWritable) {
					throw new AssignmentErrorReassignment(stmt.assignee);
				}
			} else if (!schema.isUninitialized) {
				throw new AssignmentErrorDeletion(stmt.assignee);
			}
		}
	}

	public override visitStmtLoop(stmt: STMT.StatementLoop): void {
		// Do not call `this.defaultVisit(stmt)` as we VarCheck children in a different order.
		return xjs.Array.forEachAggregated(stmt.doFirst ? [stmt.block, stmt.condition] : [stmt.condition, stmt.block], (c) => this.visit(c));
	}

	public override visitStmtIteration(stmt: STMT.StatementIteration): void {
		// Do not call `this.defaultVisit(stmt)` as we want to VarCheck `stmt.block` at the end.
		xjs.Array.forEachAggregated([stmt.typenode, stmt.iterable], (c) => this.visit(c));
		if (stmt.assignee) {
			if (stmt.block.validator.hasSymbol(stmt.id!)) {
				throw new AssignmentErrorDuplicateDeclaration(stmt.assignee);
			}
			stmt.block.validator.addSymbol(new SymbolSchemaVar(
				stmt.id!,
				stmt.assignee,
				false, // because it should not be manually reassigned
				false, // because it won’t ever be nullish upon accessing
			));
		}
		this.visit(stmt.block); // must come after assignee checks, because assignee may be referenced inside block
	}

	public override defaultVisit(node: AstNode): void {
		return xjs.Array.forEachAggregated(node.children, (c) => this.visit(c));
	}

	private visitFunctionlike(fn: Functionlike): void {
		xjs.Array.forEachAggregated(fn.captures,   (capt)  => this.visit(capt));
		xjs.Array.forEachAggregated(fn.parameters, (param) => this.visit(param));

		// ensure no duplicate parameter keys
		const key_ids = new Set<bigint>();
		xjs.Array.forEachAggregated(fn.parameters, (param) => {
			const key_id: bigint | undefined = param.labelId;
			if (key_id !== undefined) {
				if (key_ids.has(key_id)) {
					throw new AssignmentErrorDuplicateKey(param.key ?? param.identifier!);
				} else {
					key_ids.add(key_id);
				}
			}
		});

		// ensure no duplicate captures
		const capt_ids = new Set<bigint>();
		xjs.Array.forEachAggregated(fn.captures, (capt) => {
			if (capt_ids.has(capt.variable.id)) {
				throw new AssignmentErrorDuplicateDeclaration(capt.variable);
			} else {
				capt_ids.add(capt.variable.id);
			}
		});

		fn.returnType && this.visit(fn.returnType);
		return this.visit(fn.block);
	}

	#hoistFuncDecl(decl: STMT.DeclarationFunction): void {
		if (decl.identifier) {
			if (decl.validator.hasSymbol(decl.id!)) {
				return assert.ok(decl.validator.getSymbol(decl.id!) instanceof SymbolSchemaFunc, 'Only function names should be hoisted.');
			}
			decl.validator.addSymbol(new SymbolSchemaFunc(decl.id!, decl.identifier));
		}
	}
}
