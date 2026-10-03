import * as STMT from '../statement/index.ts';



export class StmtVisitorCompletion extends STMT.StmtVisitor<boolean> {
	public override visitDeclVariable(stmt: STMT.DeclarationVariable): boolean {
		return stmt.assigned?.type().isBottomType ?? false;
	}

	public override visitStmtExpr(stmt: STMT.StatementExpression): boolean {
		return stmt.expr?.type().isBottomType ?? false;
	}

	public override visitStmtClaim(stmt: STMT.StatementClaim): boolean {
		return stmt.assignee.type().isBottomType;
	}

	public override visitStmtReassignment(stmt: STMT.StatementReassignment): boolean {
		return stmt.assignee.type().isBottomType || (stmt.assigned?.type().isBottomType ?? false);
	}

	public override visitStmtConditional(stmt: STMT.StatementConditional): boolean {
		return stmt.condition.type().isBottomType || this.visit(stmt.consequent) && (stmt.alternative ? this.visit(stmt.alternative) : false);
	}

	public override visitStatementLoop(stmt: STMT.StatementLoop): boolean {
		return stmt.condition.type().isBottomType || this.visit(stmt.block);
	}

	public override visitStatementIteration(stmt: STMT.StatementIteration): boolean {
		return stmt.iterable.type().isBottomType || this.visit(stmt.block);
	}

	public override visitStatementReturn(): boolean {
		return true;
	}

	public override defaultVisit(): boolean {
		return false;
	}
}
