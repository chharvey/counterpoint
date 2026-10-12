import * as assert from 'node:assert';
import * as test from 'node:test';
import * as xjs from 'extrajs';
import {VisitorStmtBuild} from '../../src/validator/ast/visitors/VisitorStmtBuild.ts';
import {
	op_maybe_string,
	setupScript,
} from '../utils.ts';



test.suite('VisitorStmtBuild#visit', () => {
	test.test('DeclarationType has no effect.', () => {
		assert.strictEqual(setupScript(`{
			type N = int | nat | float;
		}`, {codegen: false}).builder.print(), '"block-0":\n\t(ENDPROGRAM)');
	});


	test.test('DeclarationVariable pushes (DECL+SET)/DROP instruction depending on presence of child nodes.', () => {
		const {stmts, builder} = setupScript(`{
			% Foldable cases:
			val _:          int = 42; % \`(DROP (INT.CONST 42))\`
			val assignee_a: int = 42; % \`(DECL <int> assignee_a (INT.CONST 42))\`

			% Non-Foldable cases:
			val mut assignee_b?: int;
			val mut assignee_c:  int = 42;
			val     _:           int = assignee_c;
			val     assignee_d:  int = assignee_c;
			val mut assignee_e:  int = assignee_c;

			%% Syntactically impossible cases (for completion):
			val _?:          int;
			val assignee_f?: int;
			val mut _?:      int;
			val mut _:       int = 42;
			val mut _:       int = assignee_c;
			%%
		}`, {codegen: false});
		const stmt_visitor = new VisitorStmtBuild(builder);
		stmts.forEach((stmt) => stmt_visitor.visit(stmt));
		return assert.strictEqual(builder.print(), xjs.String.dedent`
			"block-0":
				(DROP (INT.CONST 42))
				(DECL <int> assignee_a (INT.CONST 42))
				(DECL <Maybe> assignee_b ${op_maybe_string()})
				(DECL <int> assignee_c (INT.CONST 42))
				(DROP (GET assignee_c))
				(DECL <int> assignee_d (GET assignee_c))
				(DECL <int> assignee_e (GET assignee_c))
				(ENDPROGRAM)
		`.trim());
	});


	test.suite('DeclarationFunction', () => {
		test.test('function declared with blank identifier builds nothing.', () => {
			assert.strictEqual(setupScript(`{
				42;
				func _(foo: int): void {
					foo;
					return;
				}
				43;
			}`, {codegen: false}).builder.print(), xjs.String.dedent`
				"block-0":
					(DROP (INT.CONST 42))
					(DROP (INT.CONST 43))
					(ENDPROGRAM)
			`.trim());
		});
		test.test('captures.', () => {
			assert.strictEqual(setupScript(`{
				val x: int = 42;
				val mut y: float = 4.2;
				func f() with (x, ref y): void {
					x + 10;
					set y = 5.2;
					return;
				}
			}`, {codegen: false}).builder.print(), xjs.String.dedent`
				"block-0":
					(DECL <int> x (INT.CONST 42))
					(DECL <float> y (FLOAT.CONST 4.2))
					(GOTO "block-2")
				"block-1":
					(DECL <int> x (GET x))
					(DROP (INT.ADD (GET x) (INT.CONST 10)))
					(SET y (FLOAT.CONST 5.2))
					(GOTO "caller")
				"unreachable-3":
					(DROP (TRAP))
					(ENDPROGRAM)
				"block-2":
					(ENDPROGRAM)
			`.trim());
		});
		test.test('parameters and return statement.', () => {
			assert.strictEqual(setupScript(`{
				func f(foo: int, bar?: int = 41, qux?: int): void {
					foo;
					return;
					42;
				}
			}`, {codegen: false}).builder.print(), xjs.String.dedent`
				"block-0":
					(GOTO "block-2")
				"block-1":
					(DECL <int> foo)
					(DECL <int> bar (INT.CONST 41))
					(DECL <Maybe> qux ${op_maybe_string()})
					(DROP (GET foo))
					(GOTO "caller")
				"unreachable-3":
					(DROP (INT.CONST 42))
					(DROP (TRAP))
					(ENDPROGRAM)
				"block-2":
					(ENDPROGRAM)
			`.trim());
		});
		test.test('conditional return statements.', () => {
			assert.strictEqual(setupScript(`{
				func f(): void {
					if 42 < 43 then {
						44;
						return;
					} else {
						45;
						return;
					};
					46;
				}
			}`, {codegen: false}).builder.print(), xjs.String.dedent`
				"block-0":
					(GOTO "block-2")
				"block-1":
					(GOTO.IF (LT (INT.CONST 42) (INT.CONST 43)) "block-3" "block-4")
				"block-3":
					(DROP (INT.CONST 44))
					(GOTO "caller")
				"unreachable-6":
					(GOTO "block-5")
				"block-4":
					(DROP (INT.CONST 45))
					(GOTO "caller")
				"unreachable-7":
					(GOTO "block-5")
				"block-5":
					(DROP (INT.CONST 46))
					(DROP (TRAP))
					(ENDPROGRAM)
				"block-2":
					(ENDPROGRAM)
			`.trim());
		});
	});


	test.test('StatementExpression pushes OP.Drop instruction if expression exists.', () => {
		const {stmts, builder} = setupScript(`{
			val mut x: int = 42;
			x;
			42;
			;
		}`, {build: false});
		const stmt_visitor = new VisitorStmtBuild(builder);
		assert.strictEqual(builder.instructions.length, 0);
		stmt_visitor.visit(stmts[1]);
		assert.strictEqual(builder.instructions.length, 1);
		stmt_visitor.visit(stmts[2]);
		assert.strictEqual(builder.instructions.length, 2);
		stmt_visitor.visit(stmts[3]);
		assert.strictEqual(builder.instructions.length, 2);
		return assert.strictEqual(builder.print(), xjs.String.dedent`
			"block-0":
				(DROP (GET x))
				(DROP (INT.CONST 42))
		`.trim());
	});


	test.test('StatementClaim pushes OP.Drop.', () => {
		const {stmts, builder} = setupScript(`{%
			val mut x: int | float = 42;
			claim x: int;
		}`, {build: false});
		const stmt_visitor = new VisitorStmtBuild(builder);
		stmt_visitor.visit(stmts[1]);
		return assert.strictEqual(builder.print(), xjs.String.dedent`
			"block-0":
				(DROP (GET x))
		`.trim());
	});


	test.suite('StatementReassignment', () => {
		test.test('for variables: pushes (SET) with a value.', () => {
			const {stmts, builder} = setupScript(`{
				val mut x: int = 42;
				set x = 43;
				set x = 44;
				set x = -42;
			}`, {build: false});
			const stmt_visitor = new VisitorStmtBuild(builder);
			stmts.slice(1).forEach((stmt) => stmt_visitor.visit(stmt));
			return assert.strictEqual(builder.print(), xjs.String.dedent`
				"block-0":
					(SET x (INT.CONST 43))
					(SET x (INT.CONST 44))
					(SET x (INT.CONST -42))
			`.trim());
		});
		test.test('for optional variables: wraps value in (MAYBE.NEW).', () => {
			const {stmts, builder} = setupScript(`{
				val mut x?: int;
				set x = 42;
			}`, {build: false});
			const stmt_visitor = new VisitorStmtBuild(builder);
			stmts.slice(1).forEach((stmt) => stmt_visitor.visit(stmt));
			return assert.strictEqual(builder.print(), xjs.String.dedent`
				"block-0":
					(SET x ${op_maybe_string('(INT.CONST 42)')})
			`.trim());
		});
		test.test('deletion: pushes (SET) with an empty (MAYBE.NEW).', () => {
			const {stmts, builder} = setupScript(`{
				val mut x?: int;
				delete x;
			}`, {build: false});
			const stmt_visitor = new VisitorStmtBuild(builder);
			stmts.slice(1).forEach((stmt) => stmt_visitor.visit(stmt));
			return assert.strictEqual(builder.print(), xjs.String.dedent`
				"block-0":
					(SET x ${op_maybe_string()})
			`.trim());
		});
		test.test('for collections: pushes OP.CollectionDynamicSet.', () => {
			assert.strictEqual(setupScript(`{
				val mut my_list: mut [int]        = [41, 42];
				val mut my_dict: mut [:int]       = [a= 41, b= 42];
				val mut my_set:  mut {int}        = {41 + 1, 42 / 2, 43 ^ 3};
				val mut my_map:  mut {int -> int} = {21 -> 41, 22 -> 42, 23 -> 43};

				val mut accessor: int = 22;
				set my_list.[0 + 1]   = 84;
				set my_dict.[@b]      = 84;
				set my_set.[accessor] = true;
				set my_map.[accessor] = 84;
			}`, {codegen: false}).builder.print(), xjs.String.dedent`
				"block-0":
					(DECL <List> my_list (LIST.NEW (INT.CONST 41) (INT.CONST 42)))
					(DECL <Dict> my_dict (DICT.NEW @a->(INT.CONST 41) @b->(INT.CONST 42)))
					(DECL <int> $0 (INT.ADD (INT.CONST 41) (INT.CONST 1)))
					(DECL <int> $1 (INT.DIV (INT.CONST 42) (INT.CONST 2)))
					(DECL <int> $2 (INT.EXP (INT.CONST 43) (INT.CONST 3)))
					(DECL <Set> my_set (SET.NEW (GET $0) (GET $1) (GET $2)))
					(DECL <Map> my_map (MAP.NEW (INT.CONST 21)->(INT.CONST 41) (INT.CONST 22)->(INT.CONST 42) (INT.CONST 23)->(INT.CONST 43)))
					(DECL <int> accessor (INT.CONST 22))
					(DECL <int> $3 (INT.ADD (INT.CONST 0) (INT.CONST 1)))
					(LIST.SET (GET my_list) (GET $3) (INT.CONST 84))
					(DICT.SET (GET my_dict) (SYM.CONST @b) (INT.CONST 84))
					(SET.SET (GET my_set) (GET accessor) (BOOL.CONST true))
					(MAP.SET (GET my_map) (GET accessor) (INT.CONST 84))
					(ENDPROGRAM)
			`.trim());
		});
	});


	test.suite('StatementConditional', () => {
		test.test('pushes OP.GotoConditional.', () => {
			assert.strictEqual(setupScript(`{
				if true then {
					(2 * 1 + 0);
					2.2;
				} else {
					(6 / (1 + 1));
					3.3;
				};
			}`, {codegen: false}).builder.print(), xjs.String.dedent`
				"block-0":
					(GOTO.IF (BOOL.CONST true) "block-1" "block-2")
				"block-1":
					(DECL <int> $0 (INT.MUL (INT.CONST 2) (INT.CONST 1)))
					(DROP (INT.ADD (GET $0) (INT.CONST 0)))
					(DROP (FLOAT.CONST 2.2))
					(GOTO "block-3")
				"block-2":
					(DECL <int> $1 (INT.ADD (INT.CONST 1) (INT.CONST 1)))
					(DROP (INT.DIV (INT.CONST 6) (GET $1)))
					(DROP (FLOAT.CONST 3.3))
					(GOTO "block-3")
				"block-3":
					(ENDPROGRAM)
			`.trim());
		});
		test.test('with no alternative.', () => {
			assert.strictEqual(setupScript(`{
				if false then {
					(2 * 1 + 0);
					2.2;
				};
			}`, {codegen: false}).builder.print(), xjs.String.dedent`
				"block-0":
					(GOTO.IF (BOOL.CONST false) "block-1" "block-2")
				"block-1":
					(DECL <int> $0 (INT.MUL (INT.CONST 2) (INT.CONST 1)))
					(DROP (INT.ADD (GET $0) (INT.CONST 0)))
					(DROP (FLOAT.CONST 2.2))
					(GOTO "block-2")
				"block-2":
					(ENDPROGRAM)
			`.trim());
		});
		test.test('negates the condition for `unless` statements.', () => {
			assert.strictEqual(setupScript(`{
				unless false then {
					(2 * 1 + 0);
					2.2;
				};
			}`, {codegen: false}).builder.print(), xjs.String.dedent`
				"block-0":
					(GOTO.IF (NOT (BOOL.CONST false)) "block-1" "block-2")
				"block-1":
					(DECL <int> $0 (INT.MUL (INT.CONST 2) (INT.CONST 1)))
					(DROP (INT.ADD (GET $0) (INT.CONST 0)))
					(DROP (FLOAT.CONST 2.2))
					(GOTO "block-2")
				"block-2":
					(ENDPROGRAM)
			`.trim());
		});
		test.test('SSA.', () => {
			assert.strictEqual(setupScript(`{
				val mut unknown_cond: bool = false;
				val mut x: int = 42;
				if unknown_cond then {
					set x = x * (1 + 1);
					val y: float = 2.2;
				} else {
					set x = x - (6 / 2);
					val y: float = 3.3;
				};
				x;
			}`, {codegen: false}).builder.print(), xjs.String.dedent`
				"block-0":
					(DECL <bool> unknown_cond (BOOL.CONST false))
					(DECL <int> x (INT.CONST 42))
					(GOTO.IF (GET unknown_cond) "block-1" "block-2")
				"block-1":
					(DECL <int> $0 (INT.ADD (INT.CONST 1) (INT.CONST 1)))
					(SET x (INT.MUL (GET x) (GET $0)))
					(DECL <float> y (FLOAT.CONST 2.2))
					(GOTO "block-3")
				"block-2":
					(DECL <int> $1 (INT.DIV (INT.CONST 6) (INT.CONST 2)))
					(SET x (INT.SUB (GET x) (GET $1)))
					(DECL <float> y (FLOAT.CONST 3.3))
					(GOTO "block-3")
				"block-3":
					(DROP (GET x))
					(ENDPROGRAM)
			`.trim());
		});
		test.test('if–else chains.', () => {
			assert.strictEqual(setupScript(`{
				val mut cond?: bool;
				set cond = true;
				if cond == true then {
					10;
				} else if cond == false then {
					20;
				} else {
					30;
				};
			}`, {codegen: false}).builder.print(), xjs.String.dedent`
				"block-0":
					(DECL <Maybe> cond ${op_maybe_string()})
					(SET cond ${op_maybe_string('(BOOL.CONST true)')})
					(GOTO.IF (EQ (GET cond) (BOOL.CONST true)) "block-1" "block-2")
				"block-1":
					(DROP (INT.CONST 10))
					(GOTO "block-3")
				"block-2":
					(GOTO.IF (EQ (GET cond) (BOOL.CONST false)) "block-4" "block-5")
				"block-4":
					(DROP (INT.CONST 20))
					(GOTO "block-6")
				"block-5":
					(DROP (INT.CONST 30))
					(GOTO "block-6")
				"block-6":
					(GOTO "block-3")
				"block-3":
					(ENDPROGRAM)
			`.trim());
		});
	});


	test.suite('StatementLoop', () => {
		test.test('pushes OP.GotoConditional.', () => {
			assert.strictEqual(setupScript(`{
				val mut cond: bool = false;
				while cond do {
					42;
					4.2;
				};
			}`, {codegen: false}).builder.print(), xjs.String.dedent`
				"block-0":
					(DECL <bool> cond (BOOL.CONST false))
					(GOTO "block-1")
				"block-1":
					(GOTO.IF (GET cond) "block-2" "block-3")
				"block-2":
					(DROP (INT.CONST 42))
					(DROP (FLOAT.CONST 4.2))
					(GOTO "block-1")
				"block-3":
					(ENDPROGRAM)
			`.trim());
		});
		test.test('negates the condition for `until` statements.', () => {
			assert.strictEqual(setupScript(`{
				val mut cond: bool = false;
				until cond do {
					42;
				};
			}`, {codegen: false}).builder.print(), xjs.String.dedent`
				"block-0":
					(DECL <bool> cond (BOOL.CONST false))
					(GOTO "block-1")
				"block-1":
					(GOTO.IF (NOT (GET cond)) "block-2" "block-3")
				"block-2":
					(DROP (INT.CONST 42))
					(GOTO "block-1")
				"block-3":
					(ENDPROGRAM)
			`.trim());
		});
		test.test('bottom-tested conditions.', () => {
			assert.strictEqual(setupScript(`{
				val mut cond: bool = false;
				do {
					42;
					4.2;
				} while cond;
				do {
					42;
				} until cond;
			}`, {codegen: false}).builder.print(), xjs.String.dedent`
				"block-0":
					(DECL <bool> cond (BOOL.CONST false))
					(GOTO "block-1")
				"block-1":
					(DROP (INT.CONST 42))
					(DROP (FLOAT.CONST 4.2))
					(GOTO.IF (GET cond) "block-1" "block-2")
				"block-2":
					(GOTO "block-3")
				"block-3":
					(DROP (INT.CONST 42))
					(GOTO.IF (NOT (GET cond)) "block-3" "block-4")
				"block-4":
					(ENDPROGRAM)
			`.trim());
		});
	});


	test.test('StatementIteration', () => {
		assert.strictEqual(setupScript(`{
			for item: int in [10, 20, 30] do {
				item + 5;
			};
			for _: float in [4.4, 5.5, 6.6] do {
				null;
			};
		}`, {codegen: false}).builder.print(), xjs.String.dedent`
			"block-0":
				(DECL <List> $0 (LIST.NEW (INT.CONST 10) (INT.CONST 20) (INT.CONST 30)))
				(DECL <nat> $1 (NAT.CONST +0))
				(GOTO "block-1")
			"block-1":
				(DECL <nat> $2 (LIST.COUNT (GET $0)))
				(GOTO.IF (LT (GET $1) (GET $2)) "block-2" "block-3")
			"block-2":
				(DECL <int> item (LIST.GET (GET $0) (GET $1)))
				(DROP (INT.ADD (GET item) (INT.CONST 5)))
				(SET $1 (NAT.ADD (GET $1) (NAT.CONST +1)))
				(GOTO "block-1")
			"block-3":
				(DECL <List> $3 (LIST.NEW (FLOAT.CONST 4.4) (FLOAT.CONST 5.5) (FLOAT.CONST 6.6)))
				(DECL <nat> $4 (NAT.CONST +0))
				(GOTO "block-4")
			"block-4":
				(DECL <nat> $5 (LIST.COUNT (GET $3)))
				(GOTO.IF (LT (GET $4) (GET $5)) "block-5" "block-6")
			"block-5":
				(DROP (NULL.CONST null))
				(SET $4 (NAT.ADD (GET $4) (NAT.CONST +1)))
				(GOTO "block-4")
			"block-6":
				(ENDPROGRAM)
		`.trim());
	});


	test.suite('StatementBreak', () => {
		test.test('[skip=false] returns OP.Goto("endwhile"). [skip=true] returns OP.Goto("while").', () => {
			assert.strictEqual(setupScript(`{
				while true do {
					41;
					break;
					42;
					skip;
					43;
				};
				for word: str in ["alpha", "beta", "gamma"] do {
					10;
					skip;
					20;
					break;
					30;
				};
			}`, {codegen: false}).builder.print(), xjs.String.dedent`
				"block-0":
					(GOTO "block-1")
				"block-1":
					(GOTO.IF (BOOL.CONST true) "block-2" "block-3")
				"block-2":
					(DROP (INT.CONST 41))
					(GOTO "block-3")
				"unreachable-4":
					(DROP (INT.CONST 42))
					(GOTO "block-1")
				"unreachable-5":
					(DROP (INT.CONST 43))
					(GOTO "block-1")
				"block-3":
					(DECL <List> $0 (LIST.NEW (STR.CONST "alpha") (STR.CONST "beta") (STR.CONST "gamma")))
					(DECL <nat> $1 (NAT.CONST +0))
					(GOTO "block-6")
				"block-6":
					(DECL <nat> $2 (LIST.COUNT (GET $0)))
					(GOTO.IF (LT (GET $1) (GET $2)) "block-7" "block-8")
				"block-7":
					(DECL <str> word (LIST.GET (GET $0) (GET $1)))
					(DROP (INT.CONST 10))
					(GOTO "block-6")
				"unreachable-9":
					(DROP (INT.CONST 20))
					(GOTO "block-8")
				"unreachable-10":
					(DROP (INT.CONST 30))
					(SET $1 (NAT.ADD (GET $1) (NAT.CONST +1)))
					(GOTO "block-6")
				"block-8":
					(ENDPROGRAM)
			`.trim());
		});
		test.test('nested loops.', () => {
			assert.strictEqual(setupScript(`{
				while true do {
					10;
					break;
					20;
					if true then {
						30;
						while true do {
							40;
							skip;
							50;
						};
						60;
					};
					70;
				};
			}`, {codegen: false}).builder.print(), xjs.String.dedent`
				"block-0":
					(GOTO "block-1")
				"block-1":
					(GOTO.IF (BOOL.CONST true) "block-2" "block-3")
				"block-2":
					(DROP (INT.CONST 10))
					(GOTO "block-3")
				"unreachable-4":
					(DROP (INT.CONST 20))
					(GOTO.IF (BOOL.CONST true) "block-5" "block-6")
				"block-5":
					(DROP (INT.CONST 30))
					(GOTO "block-7")
				"block-7":
					(GOTO.IF (BOOL.CONST true) "block-8" "block-9")
				"block-8":
					(DROP (INT.CONST 40))
					(GOTO "block-7")
				"unreachable-10":
					(DROP (INT.CONST 50))
					(GOTO "block-7")
				"block-9":
					(DROP (INT.CONST 60))
					(GOTO "block-6")
				"block-6":
					(DROP (INT.CONST 70))
					(GOTO "block-1")
				"block-3":
					(ENDPROGRAM)
			`.trim());
		});
	});
});
