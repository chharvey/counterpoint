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
import type {Capture} from '../Capture.ts';
import type {Block} from '../Block.ts';
import type {Goal} from '../Goal.ts';
import type * as EXPR from '../expression/index.ts';
import type * as STMT from '../statement/index.ts';
import {memoizePerNode} from './decorators.ts';



export class AstNodeVisitorCompletion extends AstNodeVisitor<CompletionKind> {
	/* eslint-disable @stylistic/space-before-function-paren */
	@memoizePerNode
	public override visitProperty(node: Property): CompletionKind {
		return this.visit(node.val);
	}

	@memoizePerNode
	public override visitCase(node: Case): CompletionKind {
		return CompletionKind_max([
			...node.antecedents.map((ant) => this.visit(ant)),
			this.visit(node.consequent),
		]);
	}

	@memoizePerNode
	public override visitCapture(node: Capture): CompletionKind {
		return this.visit(node.variable);
	}

	@memoizePerNode
	public override visitBlock(node: Block): CompletionKind {
		return CompletionKind_max(node.children.map((c) => this.visit(c)));
	}

	@memoizePerNode
	public override visitGoal(node: Goal): CompletionKind {
		return node.block ? this.visit(node.block) : CompletionKind.NORMAL;
	}

	@memoizePerNode public override visitTemplate   (expr: EXPR.Template): CompletionKind { return this.#subNodesMax(expr); }
	@memoizePerNode public override visitExprTuple  (expr: EXPR.Tuple):    CompletionKind { return this.#subNodesMax(expr); }
	@memoizePerNode public override visitExprRecord (expr: EXPR.Record):   CompletionKind { return this.#subNodesMax(expr); }
	@memoizePerNode public override visitExprList   (expr: EXPR.List):     CompletionKind { return this.#subNodesMax(expr); }
	@memoizePerNode public override visitExprDict   (expr: EXPR.Dict):     CompletionKind { return this.#subNodesMax(expr); }
	@memoizePerNode public override visitExprSet    (expr: EXPR.Set):      CompletionKind { return this.#subNodesMax(expr); }
	@memoizePerNode public override visitExprMap    (expr: EXPR.Map):      CompletionKind { return this.#subNodesMax(expr); }

	@memoizePerNode
	public override visitExprBlock(expr: EXPR.ExpressionBlock): CompletionKind {
		return this.visit(expr.block);
	}

	@memoizePerNode public override visitExprAccess (expr: EXPR.Access): CompletionKind { return this.#subNodesMax(expr); }
	@memoizePerNode public override visitExprCall   (expr: EXPR.Call):   CompletionKind { return this.#subNodesMax(expr); }

	@memoizePerNode
	public override visitExprClaim(expr: EXPR.Claim): CompletionKind {
		return this.visit(expr.operand);
	}

	@memoizePerNode public override visitOperationExprUnary             (expr: EXPR.OperationUnary):             CompletionKind { return this.#subNodesMax(expr); }
	@memoizePerNode public override visitOperationExprBinaryCast        (expr: EXPR.OperationBinaryCast):        CompletionKind { return this.#subNodesMax(expr); }
	@memoizePerNode public override visitOperationExprBinaryArithmetic  (expr: EXPR.OperationBinaryArithmetic):  CompletionKind { return this.#subNodesMax(expr); }
	@memoizePerNode public override visitOperationExprBinaryComparative (expr: EXPR.OperationBinaryComparative): CompletionKind { return this.#subNodesMax(expr); }
	@memoizePerNode public override visitOperationExprBinaryEquality    (expr: EXPR.OperationBinaryEquality):    CompletionKind { return this.#subNodesMax(expr); }
	@memoizePerNode public override visitOperationExprBinaryLogical     (expr: EXPR.OperationBinaryLogical):     CompletionKind { return this.#subNodesMax(expr); }

	@memoizePerNode
	public override visitOperationExprTernary(expr: EXPR.OperationTernary): CompletionKind {
		return CompletionKind_max([
			this.visit(expr.operand0),
			CompletionKind_min([
				this.visit(expr.operand1),
				this.visit(expr.operand2),
			]),
		]);
	}

	@memoizePerNode
	public override visitSwitch(expr: EXPR.Switch): CompletionKind {
		return CompletionKind_max([
			this.visit(expr.value),
			CompletionKind_min([
				...expr.cases.map((c) => this.visit(c)),
				this.visit(expr.default_),
			]),
		]);
	}

	@memoizePerNode
	public override visitDeclVariable(stmt: STMT.DeclarationVariable): CompletionKind {
		return stmt.assigned ? this.visit(stmt.assigned) : CompletionKind.NORMAL;
	}

	@memoizePerNode
	public override visitStmtExpr(stmt: STMT.StatementExpression): CompletionKind {
		return stmt.expr ? this.visit(stmt.expr) : CompletionKind.NORMAL;
	}

	@memoizePerNode
	public override visitStmtClaim(stmt: STMT.StatementClaim): CompletionKind {
		return this.visit(stmt.assignee);
	}

	@memoizePerNode
	public override visitStmtReassignment(stmt: STMT.StatementReassignment): CompletionKind {
		return this.#subNodesMax(stmt);
	}

	@memoizePerNode
	public override visitStmtConditional(stmt: STMT.StatementConditional): CompletionKind {
		return CompletionKind_max([
			this.visit(stmt.condition),
			CompletionKind_min([
				this.visit(stmt.consequent),
				stmt.alternative ? this.visit(stmt.alternative) : CompletionKind.NORMAL,
			]),
		]);
	}

	@memoizePerNode
	public override visitStmtLoop(stmt: STMT.StatementLoop): CompletionKind {
		return this.#subNodesMax(stmt);
	}

	@memoizePerNode
	public override visitStmtIteration(stmt: STMT.StatementIteration): CompletionKind {
		return CompletionKind_max([this.visit(stmt.iterable), this.visit(stmt.block)]);
	}

	@memoizePerNode
	public override visitStmtBreak(_stmt: STMT.StatementBreak): CompletionKind {
		return CompletionKind.BREAK_OR_SKIP;
	}

	@memoizePerNode
	public override visitStmtReturn(_stmt: STMT.StatementReturn): CompletionKind {
		return CompletionKind.RETURN_OR_PANIC;
	}
	/* eslint-enable @stylistic/space-before-function-paren */

	public override defaultVisit(_node: AstNode): CompletionKind {
		return CompletionKind.NORMAL;
	}

	#subNodesMax(node: AstNode): CompletionKind {
		return CompletionKind_max(node.children.map((c) => this.visit(c)));
	}
}
