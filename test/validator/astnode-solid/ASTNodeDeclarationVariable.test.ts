import * as assert from 'assert';
import {
	CONFIG_DEFAULT,
	Operator,
	ASTNODE_SOLID as AST,
	SymbolStructure,
	SymbolStructureVar,
	SolidType,
	INST,
	Builder,
	AssignmentError01,
	TypeError03,
} from '../../../src/index.js';
import {
	assertAssignable,
} from '../../assert-helpers.js';
import {
	CONFIG_FOLDING_OFF,
	instructionConstInt,
	instructionConstFloat,
} from '../../helpers.js';



describe('ASTNodeDeclarationVariable', () => {
	describe('#varCheck', () => {
		it('adds a SymbolStructure to the symbol table with a preset `type` value of `unknown` and a preset null `value` value.', () => {
			const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
				let x: int = 42;
			`);
			assert.ok(!goal.validator.hasSymbol(256n));
			goal.varCheck();
			assert.ok(goal.validator.hasSymbol(256n));
			const info: SymbolStructure | null = goal.validator.getSymbolInfo(256n);
			assert.ok(info instanceof SymbolStructureVar);
			assert.strictEqual(info.type, SolidType.UNKNOWN);
			assert.strictEqual(info.value, null);
		});
		it('throws if the validator already contains a record for the variable.', () => {
			assert.throws(() => AST.ASTNodeGoal.fromSource(`
				let i: int = 42;
				let i: int = 43;
			`).varCheck(), AssignmentError01);
			assert.throws(() => AST.ASTNodeGoal.fromSource(`
				type FOO = float;
				let FOO: int = 42;
			`).varCheck(), AssignmentError01);
		});
	});


	describe('#typeCheck', () => {
		it('checks the assigned expression’s type against the variable assignee’s type.', () => {
			AST.ASTNodeDeclarationVariable.fromSource(`
				let  the_answer:  int | float =  21  *  2;
			`).typeCheck();
		})
		it('throws when the assigned expression’s type is not compatible with the variable assignee’s type.', () => {
			assert.throws(() => AST.ASTNodeDeclarationVariable.fromSource(`
				let  the_answer:  null =  21  *  2;
			`).typeCheck(), TypeError03);
		})
		it('with int coersion on, allows assigning ints to floats.', () => {
			AST.ASTNodeDeclarationVariable.fromSource(`
				let x: float = 42;
			`).typeCheck();
		})
		it('with int coersion off, throws when assigning int to float.', () => {
			assert.throws(() => AST.ASTNodeDeclarationVariable.fromSource(`
				let x: float = 42;
			`, {
				...CONFIG_DEFAULT,
				compilerOptions: {
					...CONFIG_DEFAULT.compilerOptions,
					intCoercion: false,
				},
			}).typeCheck(), TypeError03);
		})
		context('allows assigning a collection literal to a wider mutable type.', () => {
			function typeCheckGoal(src: string | string[], expect_thrown?: Parameters<typeof assert.throws>[1]): void {
				if (src instanceof Array) {
					return src
						.map((s) => s.trim())
						.filter((s) => !!s)
						.forEach((s) => typeCheckGoal(s, expect_thrown));
				}
				const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(src);
				goal.varCheck();
				return (expect_thrown)
					? assert.throws(() => goal.typeCheck(), expect_thrown)
					: goal.typeCheck();
			}
			it('tuples: only allows greater or equal items.', () => {
				typeCheckGoal(`
					type T = [int];
					let unfixed i: int = 42;
					let v: T = [42];

					let t1_1: mutable [42 | 4.3] = [42];
					let t2_1: mutable [int]      = [42];
					let t3_1: mutable [int]      = [i];
					let t4_1: mutable [T?]       = [v];

					let t1_2: mutable [?: 42 | 4.3] = [42];
					let t2_2: mutable [?: int]      = [i];
					let t3_2: mutable [   42 | 4.3] = [42, '43'];
					let t4_2: mutable [int, ?: str] = [42, '43'];
				`);
				typeCheckGoal(`
					let t: mutable [int, str] = [42];
				`, TypeError03);
			});
			it('records: only allows matching or more properties.', () => {
				typeCheckGoal(`
					type T = [int];
					let unfixed i: int = 42;
					let v: T = [42];

					let r1_1: mutable [a: 42 | 4.3] = [a= 42];
					let r2_1: mutable [a: int]      = [a= 42];
					let r3_1: mutable [a: int]      = [a= i];
					let r4_1: mutable [a: T?]       = [a= v];

					let r1_2: mutable [a?: 42 | 4.3]    = [a= 42];
					let r2_2: mutable [a?: int]         = [a= i];
					let r3_2: mutable [a:  42 | 4.3]    = [b= '43', a= 42];
					let r4_2: mutable [a: int, b?: str] = [b= '43', a= 42];
				`);
				typeCheckGoal(`
					let r1: mutable [a: int, b: str] = [a= 42];
					let r2: mutable [a: int, b: str] = [c= 42, b= '43'];
					let r3: mutable [a: int, b: str] = [c= 42, d= '43'];
				`.split('\n'), TypeError03);
			});
			it('should throw when assigning combo type to union.', () => {
				typeCheckGoal([
					'let x: [bool, int]       | [int, bool]       = [true, true];',
					'let x: [a: bool, b: int] | [a: int, b: bool] = [a= true, b= true];',
				], TypeError03);
				return typeCheckGoal(`
					type Employee = [
						name:         str,
						id:           int,
						job_title:    str,
						hours_worked: float,
					];
					type Volunteer = [
						name:         str,
						agency:       str,
						hours_worked: float,
					];
					let bob: Employee | Volunteer = [
						name=         'Bob', %: str
						hours_worked= 80.0,  %: float
					];
				`, TypeError03);
			});
			it('throws when not assigned to correct type.', () => {
				typeCheckGoal(`
					let t: mutable [a: int, b: str] = [   42,    '43'];
					let r: mutable [   int,    str] = [a= 42, b= '43'];
					let s: mutable {int -> str}     = {   42,    '43'};
					let s: mutable (int | str){}    = {   42 ->  '43'};
				`.split('\n'), TypeError03);
				typeCheckGoal(`
					let t1: mutable obj                                = [42, '43'];
					let t2: mutable ([int, str] | [   bool,    float]) = [42, '43'];
					let t3: mutable ([int, str] | [a: bool, b: float]) = [42, '43'];
					let t4: mutable ([int, str] | obj)                 = [42, '43'];

					let r1: mutable obj                                      = [a= 42, b= '43'];
					let r2: mutable ([a: int, b: str] | [c: bool, d: float]) = [a= 42, b= '43'];
					let r3: mutable ([a: int, b: str] | [   bool,    float]) = [a= 42, b= '43'];
					let r4: mutable ([a: int, b: str] | obj)                 = [a= 42, b= '43'];

					let s1: mutable (42 | 4.3){}            = {42};
					let s2: mutable (int | float){}         = {42};
					let s3: mutable obj                     = {42};
					let s4: mutable (int{} | {str -> bool}) = {42};
					let s5: mutable (int{} | obj)           = {42};

					let m1: mutable {int -> float}           = {42 -> 4.3};
					let m2: mutable {int? -> float?}         = {42 -> 4.3};
					let m3: mutable obj                      = {42 -> 4.3};
					let m4: mutable ({int -> float} | str{}) = {42 -> 4.3};
					let m5: mutable ({int -> float} | obj)   = {42 -> 4.3};
				`);
			});
			it('throws when entries mismatch.', () => {
				typeCheckGoal(`
					let t1: mutable [int, str]    = [42, 43];
					let t2: mutable [int, ?: str] = [42, 43];

					let r1: mutable [a: int, b: str]  = [a= 42, b= 43];
					let r2: mutable [a: int, b?: str] = [a= 42, b= 43];

					let s1: mutable int{} = {'42'};
					let s2: mutable int{} = {42, '43'};

					let m1: mutable {int -> str} = {4.2 -> '43'};
					let m2: mutable {int -> str} = {42  -> 4.3};
				`.split('\n'), TypeError03);
				typeCheckGoal(`
					let t3: mutable [   bool,    str] = [   42,    43];
					let r3: mutable [a: bool, b: str] = [a= 44, b= 45];
					let s3: mutable (bool | str){}    = {   46,    47};

					let m3_1: mutable {str -> bool} = {1 -> false, 2.0 -> true};
					let m3_2: mutable {str -> bool} = {'a' -> 3,   'b' -> 4.0};
					let m3_3: mutable {str -> bool} = {5 -> false, 'b' -> 6.0};
					let m3_4: mutable {str -> bool} = {7 -> 8.0};
					let m3_5: mutable {str -> bool} = {9 -> 'a', 10.0 -> 'b'};
				`, (err) => {
					assert.ok(err instanceof AggregateError);
					assertAssignable(err, {
						cons: AggregateError,
						errors: [
							{
								cons: AggregateError,
								errors: [
									{cons: TypeError03, message: 'Expression of type 42 is not assignable to type bool.'},
									{cons: TypeError03, message: 'Expression of type 43 is not assignable to type str.'},
								],
							},
							{
								cons: AggregateError,
								errors: [
									{cons: TypeError03, message: 'Expression of type 44 is not assignable to type bool.'},
									{cons: TypeError03, message: 'Expression of type 45 is not assignable to type str.'},
								],
							},
							{
								cons: AggregateError,
								errors: [
									{cons: TypeError03, message: 'Expression of type 46 is not assignable to type bool | str.'},
									{cons: TypeError03, message: 'Expression of type 47 is not assignable to type bool | str.'},
								],
							},
							{
								cons: AggregateError,
								errors: [
									{cons: TypeError03, message: 'Expression of type 1 is not assignable to type str.'},
									{cons: TypeError03, message: 'Expression of type 2.0 is not assignable to type str.'},
								],
							},
							{
								cons: AggregateError,
								errors: [
									{cons: TypeError03, message: 'Expression of type 3 is not assignable to type bool.'},
									{cons: TypeError03, message: 'Expression of type 4.0 is not assignable to type bool.'},
								],
							},
							{
								cons: AggregateError,
								errors: [
									{cons: TypeError03, message: 'Expression of type 5 is not assignable to type str.'},
									{cons: TypeError03, message: 'Expression of type 6.0 is not assignable to type bool.'},
								],
							},
							{
								cons: AggregateError,
								errors: [
									{cons: TypeError03, message: 'Expression of type 7 is not assignable to type str.'},
									{cons: TypeError03, message: 'Expression of type 8.0 is not assignable to type bool.'},
								],
							},
							{
								cons: AggregateError,
								errors: [
									{
										cons: AggregateError,
										errors: [
											{cons: TypeError03, message: 'Expression of type 9 is not assignable to type str.'},
											{cons: TypeError03, message: 'Expression of type \'a\' is not assignable to type bool.'},
										],
									},
									{
										cons: AggregateError,
										errors: [
											{cons: TypeError03, message: 'Expression of type 10.0 is not assignable to type str.'},
											{cons: TypeError03, message: 'Expression of type \'b\' is not assignable to type bool.'},
										],
									},
								],
							},
						],
					});
					return true;
				});
			});
		});
	});


	describe('#build', () => {
		it('with constant folding on, returns InstructionNone for fixed & foldable variables.', () => {
			const src: string = `
				let x: int = 42;
				let y: float = 4.2 * 10;
			`;
			const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(src);
			goal.varCheck();
			goal.typeCheck();
			const builder: Builder = new Builder(src)
			assert.deepStrictEqual(
				[
					goal.children[0].build(builder),
					goal.children[1].build(builder),
				],
				[
					new INST.InstructionNone(),
					new INST.InstructionNone(),
				],
			);
		});
		it('with constant folding on, returns InstructionDeclareGlobal for unfixed / non-foldable variables.', () => {
			const src: string = `
				let unfixed x: int = 42;
				let y: int = x + 10;
			`;
			const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(src);
			goal.varCheck();
			goal.typeCheck();
			const builder: Builder = new Builder(src)
			assert.deepStrictEqual(
				[
					goal.children[0].build(builder),
					goal.children[1].build(builder),
				],
				[
					new INST.InstructionDeclareGlobal(0x100n, true,  instructionConstInt(42n)),
					new INST.InstructionDeclareGlobal(0x101n, false, new INST.InstructionBinopArithmetic(
						Operator.ADD,
						new INST.InstructionGlobalGet(0x100n),
						instructionConstInt(10n),
					)),
				],
			);
		});
		it('with constant folding off, always returns InstructionDeclareGlobal.', () => {
			const src: string = `
				let x: int = 42;
				let unfixed y: float = 4.2;
			`;
			const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(src, CONFIG_FOLDING_OFF);
			goal.varCheck();
			goal.typeCheck();
			const builder: Builder = new Builder(src, CONFIG_FOLDING_OFF);
			assert.deepStrictEqual(
				[
					goal.children[0].build(builder),
					goal.children[1].build(builder),
				],
				[
					new INST.InstructionDeclareGlobal(0x100n, false, instructionConstInt(42n)),
					new INST.InstructionDeclareGlobal(0x101n, true,  instructionConstFloat(4.2)),
				],
			);
		});
	});
});
