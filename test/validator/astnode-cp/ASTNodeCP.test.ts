import * as assert from 'assert';
import type binaryen from 'binaryen';
import {
	AST,
	TYPE,
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
import {
	assertAssignable,
	assertEqualBins,
} from '../../assert-helpers.js';
import {
	typeUnitFloat,
	buildConstInt,
	buildConstFloat,
} from '../../helpers.js';



describe('ASTNodeCP', () => {
	describe('ASTNodeStatementExpression', () => {
		describe('#build', () => {
			it('returns `(nop)` for empty statement expression.', () => {
				const src: string = ';';
				const builder = new Builder(src);
				const instr: binaryen.ExpressionRef = AST.ASTNodeStatementExpression.fromSource(src).build(builder);
				return assertEqualBins(instr, builder.module.nop());
			});
			it('returns `(drop)` for nonempty statement expression.', () => {
				const src: string = '42 + 420;';
				const builder = new Builder(src);
				const stmt: AST.ASTNodeStatementExpression = AST.ASTNodeStatementExpression.fromSource(src);
				return assertEqualBins(
					stmt.build(builder),
					builder.module.drop(stmt.expr!.build(builder)),
				);
			});
			it('multiple statements.', () => {
				const src: string = '42; 420;';
				const generator = new Builder(src);
				return AST.ASTNodeGoal.fromSource(src).children.forEach((stmt) => {
					assert_instanceof(stmt, AST.ASTNodeStatementExpression);
					return assertEqualBins(
						stmt.build(generator),
						generator.module.drop(stmt.expr!.build(generator)),
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
						let unfixed i: int = 42;
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
			it('always returns `(local.set)`.', () => {
				const src: string = `
					let unfixed y: float = 4.2;
					y = y * 10;
				`;
				const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(src);
				const builder = new Builder(src);
				goal.build(builder);
				return assertEqualBins(
					goal.children[1].build(builder),
					builder.module.local.set(0, (goal.children[1] as AST.ASTNodeAssignment).assigned.build(builder)),
				);
			});
			it('coerces as necessary.', () => {
				const src: string = `
					let unfixed x: float | int = 4.2;
					let unfixed y: int | float = 4.2;
					x = 8.4; % Either<float, int>#setLeft
					x = 16;  % Either<float, int>#setRight
					x = x;   % Either<float, int>#{setLeft,setRight}
					x = y;   % Either<float, int>#{setLeft,setRight}
				`;
				const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(src);
				const builder = new Builder(src);
				goal.varCheck();
				goal.typeCheck();
				goal.build(builder);
				const default_ = {
					int:   buildConstInt(0n, builder.module),
					float: buildConstFloat(0, builder.module),
				} as const;
				const exprs: binaryen.ExpressionRef[] = goal.children.slice(2).map((stmt) => (stmt as AST.ASTNodeAssignment).assigned.build(builder));
				return assertEqualBins(
					goal.children.slice(2).map((stmt) => stmt.build(builder)),
					[
						Builder.createBinEither(builder.module, false, exprs[0],       default_.int),
						Builder.createBinEither(builder.module, true,  default_.float, exprs[1]),
						builder.module.if(
							builder.module.i32.eqz(builder.module.tuple.extract(exprs[2], 0)),
							Builder.createBinEither(builder.module, false, builder.module.tuple.extract(exprs[2], 1), default_.int),
							Builder.createBinEither(builder.module, true,  default_.float,                            builder.module.tuple.extract(exprs[2], 2)),
						),
						builder.module.if(
							builder.module.i32.eqz(builder.module.tuple.extract(exprs[3], 0)),
							Builder.createBinEither(builder.module, true,  default_.float,                            builder.module.tuple.extract(exprs[3], 1)),
							Builder.createBinEither(builder.module, false, builder.module.tuple.extract(exprs[3], 2), default_.int),
						),
					].map((expected) => builder.module.local.set(0, expected)),
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
			it('returns `(nop)` for empty program.', () => {
				const src: string = '';
				const builder = new Builder(src);
				const instr: binaryen.ExpressionRef | binaryen.Module = AST.ASTNodeGoal.fromSource(src).build(builder);
				return assertEqualBins(instr, builder.module.nop());
			});
			it('returns binaryen.Module for non-empty program.', () => {
				const src: string = '42;';
				const builder = new Builder(src);
				const instr: binaryen.ExpressionRef | binaryen.Module = AST.ASTNodeGoal.fromSource(src).build(builder);
				assert.strictEqual(instr, builder.module);
			});
		});
	});
});
