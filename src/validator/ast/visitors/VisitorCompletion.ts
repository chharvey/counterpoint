import {
	CompletionKind,
	CompletionKind_min,
	CompletionKind_max,
} from '../CompletionKind.ts';
import {AstNodeVisitor} from '../AstNode.ts';
import type * as STMT from '../statement/index.ts';



/** temporary hack until expression completions are implemented. */
function expr_compl(is_bottom_type: boolean): CompletionKind {
	return is_bottom_type ? CompletionKind.RETURN_OR_THROW : CompletionKind.NORMAL;
}



export class VisitorCompletion extends AstNodeVisitor<CompletionKind> {
	public override visitDeclVariable(stmt: STMT.DeclarationVariable): CompletionKind {
		return expr_compl(stmt.assigned?.type().isBottomType ?? false);
	}

	public override visitStmtExpr(stmt: STMT.StatementExpression): CompletionKind {
		return expr_compl(stmt.expr?.type().isBottomType ?? false);
	}

	public override visitStmtClaim(stmt: STMT.StatementClaim): CompletionKind {
		return expr_compl(stmt.assignee.type().isBottomType);
	}

	public override visitStmtReassignment(stmt: STMT.StatementReassignment): CompletionKind {
		return CompletionKind_max([
			expr_compl(stmt.assignee.type().isBottomType),
			expr_compl(stmt.assigned?.type().isBottomType ?? false),
		]);
	}

	public override visitStmtConditional(stmt: STMT.StatementConditional): CompletionKind {
		return CompletionKind_max([
			expr_compl(stmt.condition.type().isBottomType),
			CompletionKind_min([
				this.visit(stmt.consequent),
				stmt.alternative ? this.visit(stmt.alternative) : CompletionKind.NORMAL,
			]),
		]);
	}

	public override visitStatementLoop(stmt: STMT.StatementLoop): CompletionKind {
		return CompletionKind_max([expr_compl(stmt.condition.type().isBottomType), this.visit(stmt.block)]);
	}

	public override visitStatementIteration(stmt: STMT.StatementIteration): CompletionKind {
		return CompletionKind_max([expr_compl(stmt.iterable.type().isBottomType), this.visit(stmt.block)]);
	}

	public override visitStatementBreak(): CompletionKind {
		return CompletionKind.BREAK_OR_SKIP;
	}

	public override visitStatementReturn(): CompletionKind {
		return CompletionKind.RETURN_OR_THROW;
	}

	public override defaultVisit(): CompletionKind {
		return CompletionKind.NORMAL;
	}
}
