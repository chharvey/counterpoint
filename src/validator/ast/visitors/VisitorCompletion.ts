import {
	CompletionKind,
	CompletionKind_min,
	CompletionKind_max,
} from '../CompletionKind.ts';
import {
	AstNodeVisitor,
	type AstNode,
} from '../AstNode.ts';
import type {Property} from '../Property.ts';
import type {Case} from '../Case.ts';
import type {Block} from '../Block.ts';
import type {Goal} from '../Goal.ts';
import type * as EXPR from '../expression/index.ts';
import type * as STMT from '../statement/index.ts';



export class VisitorCompletion extends AstNodeVisitor<CompletionKind> {
	/* eslint-disable @stylistic/space-before-function-paren */
	public override visitProperty(node: Property): CompletionKind {
		return this.visit(node.val);
	}

	public override visitCase(node: Case): CompletionKind {
		return CompletionKind_max([
			...node.antecedents.map((ant) => this.visit(ant)),
			this.visit(node.consequent),
		]);
	}

	public override visitBlock(node: Block): CompletionKind {
		return CompletionKind_max(node.children.map((c) => this.visit(c)));
	}

	public override visitGoal(node: Goal): CompletionKind {
		return node.block ? this.visit(node.block) : CompletionKind.NORMAL;
	}

	public override visitTemplate   (expr: EXPR.Template): CompletionKind { return this.#subNodesMax(expr); }
	public override visitExprTuple  (expr: EXPR.Tuple):    CompletionKind { return this.#subNodesMax(expr); }
	public override visitExprRecord (expr: EXPR.Record):   CompletionKind { return this.#subNodesMax(expr); }
	public override visitExprList   (expr: EXPR.List):     CompletionKind { return this.#subNodesMax(expr); }
	public override visitExprDict   (expr: EXPR.Dict):     CompletionKind { return this.#subNodesMax(expr); }
	public override visitExprSet    (expr: EXPR.Set):      CompletionKind { return this.#subNodesMax(expr); }
	public override visitExprMap    (expr: EXPR.Map):      CompletionKind { return this.#subNodesMax(expr); }

	public override visitExprBlock(expr: EXPR.ExpressionBlock): CompletionKind {
		return this.visit(expr.block);
	}

	public override visitExprAccess (expr: EXPR.Access): CompletionKind { return this.#subNodesMax(expr); }
	public override visitExprCall   (expr: EXPR.Call):   CompletionKind { return this.#subNodesMax(expr); }

	public override visitExprClaim(expr: EXPR.Claim): CompletionKind {
		return this.visit(expr.operand);
	}

	public override visitOperationExprUnary             (expr: EXPR.OperationUnary):             CompletionKind { return this.#subNodesMax(expr); }
	public override visitOperationExprBinaryCast        (expr: EXPR.OperationBinaryCast):        CompletionKind { return this.#subNodesMax(expr); }
	public override visitOperationExprBinaryArithmetic  (expr: EXPR.OperationBinaryArithmetic):  CompletionKind { return this.#subNodesMax(expr); }
	public override visitOperationExprBinaryComparative (expr: EXPR.OperationBinaryComparative): CompletionKind { return this.#subNodesMax(expr); }
	public override visitOperationExprBinaryEquality    (expr: EXPR.OperationBinaryEquality):    CompletionKind { return this.#subNodesMax(expr); }
	public override visitOperationExprBinaryLogical     (expr: EXPR.OperationBinaryLogical):     CompletionKind { return this.#subNodesMax(expr); }

	public override visitOperationExprTernary(expr: EXPR.OperationTernary): CompletionKind {
		return CompletionKind_max([
			this.visit(expr.operand0),
			CompletionKind_min([
				this.visit(expr.operand1),
				this.visit(expr.operand2),
			]),
		]);
	}

	public override visitSwitch(expr: EXPR.Switch): CompletionKind {
		return CompletionKind_max([
			this.visit(expr.value),
			CompletionKind_min([
				...expr.cases.map((c) => this.visit(c)),
				this.visit(expr.default_),
			]),
		]);
	}

	public override visitDeclVariable(stmt: STMT.DeclarationVariable): CompletionKind {
		return stmt.assigned ? this.visit(stmt.assigned) : CompletionKind.NORMAL;
	}

	public override visitStmtExpr(stmt: STMT.StatementExpression): CompletionKind {
		return stmt.expr ? this.visit(stmt.expr) : CompletionKind.NORMAL;
	}

	public override visitStmtClaim(stmt: STMT.StatementClaim): CompletionKind {
		return this.visit(stmt.assignee);
	}

	public override visitStmtReassignment(stmt: STMT.StatementReassignment): CompletionKind {
		return this.#subNodesMax(stmt);
	}

	public override visitStmtConditional(stmt: STMT.StatementConditional): CompletionKind {
		return CompletionKind_max([
			this.visit(stmt.condition),
			CompletionKind_min([
				this.visit(stmt.consequent),
				stmt.alternative ? this.visit(stmt.alternative) : CompletionKind.NORMAL,
			]),
		]);
	}

	public override visitStatementLoop(stmt: STMT.StatementLoop): CompletionKind {
		return this.#subNodesMax(stmt);
	}

	public override visitStatementIteration(stmt: STMT.StatementIteration): CompletionKind {
		return CompletionKind_max([this.visit(stmt.iterable), this.visit(stmt.block)]);
	}

	public override visitStatementBreak(): CompletionKind {
		return CompletionKind.BREAK_OR_SKIP;
	}

	public override visitStatementReturn(): CompletionKind {
		return CompletionKind.RETURN_OR_THROW;
	}
	/* eslint-enable @stylistic/space-before-function-paren */

	public override defaultVisit(): CompletionKind {
		return CompletionKind.NORMAL;
	}

	#subNodesMax(node: AstNode): CompletionKind {
		return CompletionKind_max(node.children.map((c) => this.visit(c)));
	}
}
