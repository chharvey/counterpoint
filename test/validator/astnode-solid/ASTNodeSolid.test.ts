import * as assert from 'assert';
import {
	Operator,
	ASTNODE_SOLID as AST,
	SolidType,
	INST,
	Builder,
	ReferenceError01,
	ReferenceError03,
	AssignmentError01,
	AssignmentError10,
	TypeError01,
	TypeError03,
	MutabilityError01,
} from '../../../src/index.js';
import {
	assertAssignable,
} from '../../assert-helpers.js';
import {
	typeConstFloat,
	instructionConstFloat,
} from '../../helpers.js';



describe('ASTNodeSolid', () => {
	describe('ASTNodeStatementExpression', () => {
		describe('#build', () => {
			it('returns InstructionNone for empty statement expression.', () => {
				const src: string = `;`;
				const instr: INST.InstructionNone | INST.InstructionStatement = AST.ASTNodeStatementExpression.fromSource(src)
					.build(new Builder(src))
				assert.ok(instr instanceof INST.InstructionNone);
			})
			it('returns InstructionStatement for nonempty statement expression.', () => {
				const src: string = `42 + 420;`;
				const builder: Builder = new Builder(src);
				const stmt: AST.ASTNodeStatementExpression = AST.ASTNodeStatementExpression.fromSource(src);
				assert.deepStrictEqual(
					stmt.build(builder),
					new INST.InstructionStatement(0n, AST.ASTNodeOperationBinaryArithmetic.fromSource(src).build(builder)),
				);
			})
			it('multiple statements.', () => {
				const src: string = `42; 420;`;
				const generator: Builder = new Builder(src);
				AST.ASTNodeGoal.fromSource(src).children.forEach((stmt, i) => {
					assert.ok(stmt instanceof AST.ASTNodeStatementExpression);
					assert.deepStrictEqual(
						stmt.build(generator),
						new INST.InstructionStatement(BigInt(i), AST.ASTNodeConstant.fromSource(stmt.source).build(generator)),
					);
				});
			});
		});
	});



	describe('ASTNodeAssignment', () => {
		describe('#varCheck', () => {
			it('throws if the variable is not unfixed.', () => {
				AST.ASTNodeGoal.fromSource(`
					let unfixed i: int = 42;
					i = 43;
				`).varCheck(); // assert does not throw
				assert.throws(() => AST.ASTNodeGoal.fromSource(`
					let i: int = 42;
					i = 43;
				`).varCheck(), AssignmentError10);
			});
			it('always throws for type alias reassignment.', () => {
				assert.throws(() => AST.ASTNodeGoal.fromSource(`
					type T = 42;
					T = 43;
				`).varCheck(), ReferenceError03);
			});
		});


		describe('#typeCheck', () => {
			context('for variable reassignment.', () => {
				it('throws when variable assignee type is not supertype.', () => {
					const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
						let unfixed i: int = 42;
						i = 4.3;
					`);
					goal.varCheck();
					assert.throws(() => goal.typeCheck(), TypeError03);
				});
			});

			context('for property reassignment.', () => {
				it('throws when property assignee type is not supertype.', () => {
					[
						`
							let t: mutable [42] = [42];
							t.0 = 4.2;
						`,
						`
							let r: mutable [i: 42] = [i= 42];
							r.i = 4.2;
						`,
						`
							let l: mutable int[] = List.<int>([42]);
							l.0 = 4.2;
						`,
						`
							let d: mutable [:int] = Dict.<int>([i= 42]);
							d.i = 4.2;
						`,
						`
							let s: mutable int{} = Set.<int>([42]);
							s.[42] = 4.2;
						`,
						`
							let m: mutable {bool -> int} = Map.<bool, int>([[true, 42]]);
							m.[true] = 4.2;
						`,
					].forEach((src) => {
						const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(src);
						goal.varCheck();
						assert.throws(() => goal.typeCheck(), TypeError03);
					});
				});
				it('throws when assignee’s base type is not mutable.', () => {
					[
						`
							let t: [42] = [42];
							t.0 = 4.2;
						`,
						`
							let r: [i: 42] = [i= 42];
							r.i = 4.2;
						`,
						`
							let l: int[] = List.<int>([42]);
							l.0 = 4.2;
						`,
						`
							let d: [:int] = Dict.<int>([i= 42]);
							d.i = 4.2;
						`,
						`
							let s: int{} = Set.<int>([42]);
							s.[42] = 4.2;
						`,
						`
							let m: {bool -> int} = Map.<bool, int>([[true, 42]]);
							m.[true] = 4.2;
						`,
					].forEach((src) => {
						const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(src);
						goal.varCheck();
						assert.throws(() => goal.typeCheck(), MutabilityError01);
					});
				});
			});
		});


		describe('#build', () => {
			it('always returns InstructionStatement containing InstructionGlobalSet.', () => {
				const src: string = `
					let unfixed y: float = 4.2;
					y = y * 10;
				`;
				const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(src);
				const builder: Builder = new Builder(src);
				assert.deepStrictEqual(
					goal.children[1].build(builder),
					new INST.InstructionStatement(
						0n,
						new INST.InstructionGlobalSet(0x100n, new INST.InstructionBinopArithmetic(
							Operator.MUL,
							new INST.InstructionGlobalGet(0x100n, true),
							instructionConstFloat(10.0),
						)),
					),
				);
			});
		});
	});



	describe('ASTNodeGoal', () => {
		describe('#varCheck', () => {
			it('aggregates multiple errors.', () => {
				assert.throws(() => AST.ASTNodeGoal.fromSource(`
					a + b || c * d;
					let y: V & W | X & Y = null;
					let x: int = 42;
					let x: int = 420;
					x = 4200;
					type T = int;
					type T = float;
					let z: x = null;
					let z: int = T;
				`).varCheck(), (err) => {
					assert.ok(err instanceof AggregateError);
					assertAssignable(err, {
						cons: AggregateError,
						errors: [
							{
								cons: AggregateError,
								errors: [
									{
										cons: AggregateError,
										errors: [
											{cons: ReferenceError01, message: '`a` is never declared.'},
											{cons: ReferenceError01, message: '`b` is never declared.'},
										],
									},
									{
										cons: AggregateError,
										errors: [
											{cons: ReferenceError01, message: '`c` is never declared.'},
											{cons: ReferenceError01, message: '`d` is never declared.'},
										],
									},
								],
							},
							{
								cons: AggregateError,
								errors: [
									{
										cons: AggregateError,
										errors: [
											{cons: ReferenceError01, message: '`V` is never declared.'},
											{cons: ReferenceError01, message: '`W` is never declared.'},
										],
									},
									{
										cons: AggregateError,
										errors: [
											{cons: ReferenceError01, message: '`X` is never declared.'},
											{cons: ReferenceError01, message: '`Y` is never declared.'},
										],
									},
								],
							},
							{cons: AssignmentError01, message: 'Duplicate declaration: `x` is already declared.'},
							{cons: AssignmentError10, message: 'Reassignment of a fixed variable: `x`.'},
							{cons: AssignmentError01, message: 'Duplicate declaration: `T` is already declared.'},
							{cons: ReferenceError03, message: '`x` refers to a value, but is used as a type.'},
							{cons: ReferenceError03, message: '`T` refers to a type, but is used as a value.'},
						],
					});
					return true;
				});
			});
		});


		describe('#typeCheck', () => {
			it('aggregates multiple errors.', () => {
				const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
					let a: null = null;
					let b: null = null;
					let c: null = null;
					let d: null = null;
					a * b + c * d;
					let e: null = null;
					let f: null = null;
					let g: null = null;
					let h: null = null;
					e * f + g * h;
					if null then 42 else 4.2;
					let x: int = 4.2;
				`);
				goal.varCheck();
				assert.throws(() => goal.typeCheck(), (err) => {
					assert.ok(err instanceof AggregateError);
					assertAssignable(err, {
						cons: AggregateError,
						errors: [
							{
								cons: AggregateError,
								errors: [
									{cons: TypeError01, message: 'Invalid operation: `a * b` at line 6 col 6.'}, // TODO remove line&col numbers from message
									{cons: TypeError01, message: 'Invalid operation: `c * d` at line 6 col 14.'},
								],
							},
							{
								cons: AggregateError,
								errors: [
									{cons: TypeError01, message: 'Invalid operation: `e * f` at line 11 col 6.'},
									{cons: TypeError01, message: 'Invalid operation: `g * h` at line 11 col 14.'},
								],
							},
							{cons: TypeError01, message: 'Invalid operation: `if null then 42 else 4.2` at line 12 col 6.'},
							{cons: TypeError03, message: `Expression of type ${ typeConstFloat(4.2) } is not assignable to type ${ SolidType.INT }.`},
						],
					});
					return true;
				});
			});
		});


		describe('#build', () => {
			it('returns InstructionNone.', () => {
				const src: string = ``;
				const instr: INST.InstructionNone | INST.InstructionModule = AST.ASTNodeGoal.fromSource(src).build(new Builder(src));
				assert.ok(instr instanceof INST.InstructionNone);
			});
		});
	});
});
