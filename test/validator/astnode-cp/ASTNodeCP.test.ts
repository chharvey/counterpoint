import * as assert from 'assert';
import {
	Operator,
	AST,
	TYPE,
	INST,
	Builder,
	ReferenceErrorUndeclared,
	ReferenceErrorKind,
	AssignmentErrorDuplicateDeclaration,
	AssignmentErrorReassignment,
	TypeErrorInvalidOperation,
	TypeErrorNotAssignable,
	MutabilityError01,
} from '../../../src/index.js';
import {assert_instanceof} from '../../../src/lib/index.js';
import {assertAssignable} from '../../assert-helpers.js';
import {
	typeUnitFloat,
	instructionConstFloat,
} from '../../helpers.js';



describe('ASTNodeCP', () => {
	describe('ASTNodeStatementExpression', () => {
		describe('#build', () => {
			it('returns InstructionNone for empty statement expression.', () => {
				const src: string = ';';
				const instr: INST.InstructionNone | INST.InstructionStatement = AST.ASTNodeStatementExpression.fromSource(src)
					.build(new Builder(src));
				assert_instanceof(instr, INST.InstructionNone);
			});
			it('returns InstructionStatement for nonempty statement expression.', () => {
				const src: string = '42 + 420;';
				const builder = new Builder(src);
				const stmt: AST.ASTNodeStatementExpression = AST.ASTNodeStatementExpression.fromSource(src);
				assert.deepStrictEqual(
					stmt.build(builder),
					new INST.InstructionStatement(0n, AST.ASTNodeOperationBinaryArithmetic.fromSource(src).build(builder)),
				);
			});
			it('multiple statements.', () => {
				const src: string = '42; 420;';
				const generator = new Builder(src);
				AST.ASTNodeGoal.fromSource(src).children.forEach((stmt, i) => {
					assert_instanceof(stmt, AST.ASTNodeStatementExpression);
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
					let var i: int = 42;
					i = 43;
				`).varCheck(); // assert does not throw
				assert.throws(() => AST.ASTNodeGoal.fromSource(`
					let i: int = 42;
					i = 43;
				`).varCheck(), AssignmentErrorReassignment);
			});
			it('always throws for type alias reassignment.', () => {
				assert.throws(() => AST.ASTNodeGoal.fromSource(`
					type T = 42;
					T = 43;
				`).varCheck(), ReferenceErrorKind);
			});
		});


		describe('#typeCheck', () => {
			context('for variable reassignment.', () => {
				it('throws when variable assignee type is not supertype.', () => {
					const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
						let var i: int = 42;
						i = 4.3;
					`);
					goal.varCheck();
					assert.throws(() => goal.typeCheck(), TypeErrorNotAssignable);
				});
			});

			context('for property reassignment.', () => {
				it('allows assignment directly on objects.', () => {
					const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
						List.<int>([42]).0                   = 42;
						Dict.<int>([i= 42]).i                = 42;
						Set.<int>([42]).[43]                 = false;
						Map.<bool, int>([[true, 42]]).[true] = 42;
					`);
					goal.varCheck();
					return goal.typeCheck(); // assert does not throw
				});
				it('throws when property assignee type is not supertype.', () => {
					[
						`
							let l: mut int[] = List.<int>([42]);
							l.0 = 4.2;
						`,
						`
							let d: mut [:int] = Dict.<int>([i= 42]);
							d.i = 4.2;
						`,
						`
							let s: mut int{} = Set.<int>([42]);
							s.[42] = 4.2;
						`,
						`
							let m: mut {bool -> int} = Map.<bool, int>([[true, 42]]);
							m.[true] = 4.2;
						`,
					].forEach((src) => {
						const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(src);
						goal.varCheck();
						assert.throws(() => goal.typeCheck(), TypeErrorNotAssignable);
					});
				});
				it('throws when assignee’s base type is not mutable.', () => {
					[
						`
							let t: [int] = [42];
							t.0 = 43;
						`,
						`
							let r: [i: int] = [i= 42];
							r.i = 43;
						`,
						`
							let l: int[] = List.<int>([42]);
							l.0 = 43;
						`,
						`
							let d: [:int] = Dict.<int>([i= 42]);
							d.i = 43;
						`,
						`
							let s: int{} = Set.<int>([42]);
							s.[43] = true;
						`,
						`
							let m: {bool -> int} = Map.<bool, int>([[true, 42]]);
							m.[true] = 43;
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
					let var y: float = 4.2;
					y = y * 10;
				`;
				const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(src);
				const builder = new Builder(src);
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
					assert_instanceof(err, AggregateError);
					assertAssignable(err, {
						cons:   AggregateError,
						errors: [
							{
								cons:   AggregateError,
								errors: [
									{
										cons:   AggregateError,
										errors: [
											{cons: ReferenceErrorUndeclared, message: '`a` is never declared.'},
											{cons: ReferenceErrorUndeclared, message: '`b` is never declared.'},
										],
									},
									{
										cons:   AggregateError,
										errors: [
											{cons: ReferenceErrorUndeclared, message: '`c` is never declared.'},
											{cons: ReferenceErrorUndeclared, message: '`d` is never declared.'},
										],
									},
								],
							},
							{
								cons:   AggregateError,
								errors: [
									{
										cons:   AggregateError,
										errors: [
											{cons: ReferenceErrorUndeclared, message: '`V` is never declared.'},
											{cons: ReferenceErrorUndeclared, message: '`W` is never declared.'},
										],
									},
									{
										cons:   AggregateError,
										errors: [
											{cons: ReferenceErrorUndeclared, message: '`X` is never declared.'},
											{cons: ReferenceErrorUndeclared, message: '`Y` is never declared.'},
										],
									},
								],
							},
							{cons: AssignmentErrorDuplicateDeclaration, message: 'Duplicate declaration of `x`.'},
							{cons: AssignmentErrorReassignment,         message: 'Reassignment of fixed variable `x`.'},
							{cons: AssignmentErrorDuplicateDeclaration, message: 'Duplicate declaration of `T`.'},
							{cons: ReferenceErrorKind,                  message: '`x` refers to a value, but is used as a type.'},
							{cons: ReferenceErrorKind,                  message: '`T` refers to a type, but is used as a value.'},
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
					assert_instanceof(err, AggregateError);
					assertAssignable(err, {
						cons:   AggregateError,
						errors: [
							{
								cons:   AggregateError,
								errors: [
									{cons: TypeErrorInvalidOperation, message: 'Invalid operation: `a * b` at line 6 col 6.'}, // TODO remove line&col numbers from message
									{cons: TypeErrorInvalidOperation, message: 'Invalid operation: `c * d` at line 6 col 14.'},
								],
							},
							{
								cons:   AggregateError,
								errors: [
									{cons: TypeErrorInvalidOperation, message: 'Invalid operation: `e * f` at line 11 col 6.'},
									{cons: TypeErrorInvalidOperation, message: 'Invalid operation: `g * h` at line 11 col 14.'},
								],
							},
							{cons: TypeErrorInvalidOperation, message: 'Invalid operation: `if null then 42 else 4.2` at line 12 col 6.'},
							{cons: TypeErrorNotAssignable,    message: `Expression of type \`${ typeUnitFloat(4.2) }\` is not assignable to type \`${ TYPE.INT }\`.`},
						],
					});
					return true;
				});
			});
		});


		describe('#build', () => {
			it('returns InstructionNone.', () => {
				const src: string = '';
				const instr: INST.InstructionNone | INST.InstructionModule = AST.ASTNodeGoal.fromSource(src).build(new Builder(src));
				assert_instanceof(instr, INST.InstructionNone);
			});
		});
	});
});
