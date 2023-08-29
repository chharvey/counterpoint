import * as assert from 'assert';
import binaryen from 'binaryen';
import {
	SolidConfig,
	CONFIG_DEFAULT,
	Dev,
	ASTNODE_SOLID as AST,
	SolidType,
	SolidTypeUnit,
	SolidObject,
	SolidNull,
	SolidBoolean,
	Int16,
	Float64,
	SolidString,
	Builder,
	BinEither,
	TypeError01,
	NanError01,
	NanError02,
} from '../../../src/index.js';
import {
	assertEqualTypes,
	assertEqualBins,
} from '../../assert-helpers.js';
import {
	CONFIG_FOLDING_OFF,
	typeConstInt,
	typeConstFloat,
	typeConstStr,
	buildConstInt,
	buildConstFloat,
	buildConvert,
} from '../../helpers.js';



const CONFIG_FOLDING_COERCION_OFF: SolidConfig = {
	...CONFIG_DEFAULT,
	compilerOptions: {
		...CONFIG_DEFAULT.compilerOptions,
		constantFolding: false,
		intCoercion: false,
	},
};
function typeOperations(tests: ReadonlyMap<string, SolidObject>, config: SolidConfig = CONFIG_DEFAULT): void {
	return assert.deepStrictEqual(
		[...tests.keys()].map((src) => AST.ASTNodeOperation.fromSource(src, config).type()),
		[...tests.values()].map((expected) => new SolidTypeUnit(expected)),
	);
}
function foldOperations(tests: Map<string, SolidObject>): void {
	return assert.deepStrictEqual(
		[...tests.keys()].map((src) => AST.ASTNodeOperation.fromSource(src).fold()),
		[...tests.values()],
	);
}
function buildOperations(tests: ReadonlyMap<string, binaryen.ExpressionRef>, config: SolidConfig = CONFIG_FOLDING_OFF): void {
	return assertEqualBins(
		[...tests.keys()].map((src) => AST.ASTNodeOperation.fromSource(src, config).build(new Builder(src, config))),
		[...tests.values()],
	);
}
function typeOfOperationFromSource(src: string): SolidType {
	return AST.ASTNodeOperation.fromSource(src, CONFIG_FOLDING_COERCION_OFF).type();
}



describe('ASTNodeOperation', () => {
	function typeOfStmtExpr(stmt: AST.ASTNodeStatement): SolidType {
		assert.ok(stmt instanceof AST.ASTNodeStatementExpression);
		return stmt.expr!.type();
	}



	describe('#type', () => {
		it('returns Never for NanErrors.', () => {
			[
				AST.ASTNodeOperationBinaryArithmetic.fromSource(`-4 ^ -0.5;`).type(),
				AST.ASTNodeOperationBinaryArithmetic.fromSource(`1.5 / 0.0;`).type(),
			].forEach((typ) => {
				assert.strictEqual(typ, SolidType.NEVER);
			})
		});
	});



	describe('#build', () => {
		it('compound expression.', () => {
			const mod = new binaryen.Module();
			return buildOperations(new Map([
				[`42 ^ 2 * 420;`, mod.i32.mul(
					mod.call('exp', [buildConstInt(42n, mod), buildConstInt(2n, mod)], binaryen.i32),
					buildConstInt(420n, mod),
				)],
				[`2 * 3.0 + 5;`, mod.f64.add(
					mod.f64.mul(buildConvert(2n, mod), buildConstFloat(3.0, mod)),
					buildConvert(5n, mod),
				)],
			]));
		});
	});



	describe('ASTNodeOperationUnary', () => {
		describe('#type', () => {
			context('with constant folding on.', () => {
				it('returns a constant Boolean type for boolean unary operation of anything.', () => {
					typeOperations(new Map([
						[`!false;`,  SolidBoolean.TRUE],
						[`!true;`,   SolidBoolean.FALSE],
						[`!null;`,   SolidBoolean.TRUE],
						[`!42;`,     SolidBoolean.FALSE],
						[`!4.2e+1;`, SolidBoolean.FALSE],
						[`?false;`,  SolidBoolean.TRUE],
						[`?true;`,   SolidBoolean.FALSE],
						[`?null;`,   SolidBoolean.TRUE],
						[`?42;`,     SolidBoolean.FALSE],
						[`?4.2e+1;`, SolidBoolean.FALSE],

						[`![];`,         SolidBoolean.FALSE],
						[`![42];`,       SolidBoolean.FALSE],
						[`![a= 42];`,    SolidBoolean.FALSE],
						[`!{};`,         SolidBoolean.FALSE],
						[`!{42};`,       SolidBoolean.FALSE],
						[`!{41 -> 42};`, SolidBoolean.FALSE],
						[`?[];`,         SolidBoolean.TRUE],
						[`?[42];`,       SolidBoolean.FALSE],
						[`?[a= 42];`,    SolidBoolean.FALSE],
						[`?{};`,         SolidBoolean.TRUE],
						[`?{42};`,       SolidBoolean.FALSE],
						[`?{41 -> 42};`, SolidBoolean.FALSE],
					]));
				});
			});

			context('with constant folding off.', () => {
				describe('[operator=NOT]', () => {
					it('returns type `true` for a subtype of `void | null | false`.', () => {
						const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
							let unfixed a: null = null;
							let unfixed b: null | false = null;
							let unfixed c: null | void = null;
							!a;
							!b;
							!c;
						`, CONFIG_FOLDING_OFF);
						goal.varCheck();
						goal.typeCheck();
						goal.children.slice(3).forEach((stmt) => {
							assert.deepStrictEqual(typeOfStmtExpr(stmt), SolidBoolean.TRUETYPE);
						});
					});
					it('returns type `bool` for a supertype of `void` or a supertype of `null` or a supertype of `false`.', () => {
						const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
							let unfixed a: null | int = null;
							let unfixed b: null | int = 42;
							let unfixed c: bool = false;
							let unfixed d: bool | float = 4.2;
							let unfixed e: str | void = 'hello';
							!a;
							!b;
							!c;
							!d;
							!e;
						`, CONFIG_FOLDING_OFF);
						goal.varCheck();
						goal.typeCheck();
						goal.children.slice(5).forEach((stmt) => {
							assert.deepStrictEqual(typeOfStmtExpr(stmt), SolidType.BOOL);
						});
					});
					it('returns type `false` for any type not a supertype of `null` or `false`.', () => {
						const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
							let unfixed a: int = 42;
							let unfixed b: float = 4.2;
							!a;
							!b;
						`, CONFIG_FOLDING_OFF);
						goal.varCheck();
						goal.typeCheck();
						goal.children.slice(2).forEach((stmt) => {
							assert.deepStrictEqual(typeOfStmtExpr(stmt), SolidBoolean.FALSETYPE);
						});
					});
					it('[literalCollection] returns type `false` for any type not a supertype of `null` or `false`.', () => {
						const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
							![];
							![42];
							![a= 42];
							!{41 -> 42};
						`, CONFIG_FOLDING_OFF);
						goal.varCheck();
						goal.typeCheck();
						goal.children.forEach((stmt) => {
							assert.deepStrictEqual(typeOfStmtExpr(stmt), SolidBoolean.FALSETYPE);
						});
					});
				});
				describe('[operator=EMP]', () => {
					it('always returns type `bool`.', () => {
						[
							`?false;`,
							`?true;`,
							`?null;`,
							`?42;`,
							`?4.2e+1;`,

							`?[];`,
							`?[42];`,
							`?[a= 42];`,
							`?{41 -> 42};`,
						].map((src) => AST.ASTNodeOperation.fromSource(src, CONFIG_FOLDING_OFF).type()).forEach((typ) => {
							assert.deepStrictEqual(typ, SolidType.BOOL);
						});
					});
				});
			});
		});


		describe('#fold', () => {
			specify('[operator=NOT]', () => {
				foldOperations(new Map([
					[`!false;`,  SolidBoolean.TRUE],
					[`!true;`,   SolidBoolean.FALSE],
					[`!null;`,   SolidBoolean.TRUE],
					[`!0;`,      SolidBoolean.FALSE],
					[`!42;`,     SolidBoolean.FALSE],
					[`!0.0;`,    SolidBoolean.FALSE],
					[`!-0.0;`,   SolidBoolean.FALSE],
					[`!4.2e+1;`, SolidBoolean.FALSE],
				]));
				Dev.supports('stringConstant-assess') && foldOperations(new Map([
					[`!'';`,      SolidBoolean.FALSE],
					[`!'hello';`, SolidBoolean.FALSE],
				]));
				foldOperations(new Map([
					[`![];`,                  SolidBoolean.FALSE],
					[`![42];`,                SolidBoolean.FALSE],
					[`![a= 42];`,             SolidBoolean.FALSE],
					[`!List.<int>([]);`,      SolidBoolean.FALSE],
					[`!List.<int>([42]);`,    SolidBoolean.FALSE],
					[`!Dict.<int>([a= 42]);`, SolidBoolean.FALSE],
					[`!{};`,                  SolidBoolean.FALSE],
					[`!{42};`,                SolidBoolean.FALSE],
					[`!{41 -> 42};`,          SolidBoolean.FALSE],
				]));
			});
			specify('[operator=EMP]', () => {
				foldOperations(new Map([
					[`?false;`,  SolidBoolean.TRUE],
					[`?true;`,   SolidBoolean.FALSE],
					[`?null;`,   SolidBoolean.TRUE],
					[`?0;`,      SolidBoolean.TRUE],
					[`?42;`,     SolidBoolean.FALSE],
					[`?0.0;`,    SolidBoolean.TRUE],
					[`?-0.0;`,   SolidBoolean.TRUE],
					[`?4.2e+1;`, SolidBoolean.FALSE],
				]));
				Dev.supports('stringConstant-assess') && foldOperations(new Map([
					[`?'';`,      SolidBoolean.TRUE],
					[`?'hello';`, SolidBoolean.FALSE],
				]));
				foldOperations(new Map([
					[`?[];`,                  SolidBoolean.TRUE],
					[`?[42];`,                SolidBoolean.FALSE],
					[`?[a= 42];`,             SolidBoolean.FALSE],
					[`?List.<int>([]);`,      SolidBoolean.TRUE],
					[`?List.<int>([42]);`,    SolidBoolean.FALSE],
					[`?Dict.<int>([a= 42]);`, SolidBoolean.FALSE],
					[`?{};`,                  SolidBoolean.TRUE],
					[`?{42};`,                SolidBoolean.FALSE],
					[`?{41 -> 42};`,          SolidBoolean.FALSE],
				]));
			});
		});


		describe('#build', () => {
			function callUnaryOp(mod: binaryen.Module, name: string, arg: binaryen.ExpressionRef): binaryen.ExpressionRef {
				return mod.call(name, [arg], binaryen.i32);
			}
			it('returns the correct operation.', () => {
				const mod = new binaryen.Module();
				return buildOperations(new Map<string, binaryen.ExpressionRef>([
					[`!null;`,  callUnaryOp(mod, 'inot', buildConstInt   (0n,  mod))],
					[`!false;`, callUnaryOp(mod, 'inot', buildConstInt   (0n,  mod))],
					[`!true;`,  callUnaryOp(mod, 'inot', buildConstInt   (1n,  mod))],
					[`!42;`,    callUnaryOp(mod, 'inot', buildConstInt   (42n, mod))],
					[`!4.2;`,   callUnaryOp(mod, 'fnot', buildConstFloat (4.2, mod))],
					[`?null;`,  callUnaryOp(mod, 'iemp', buildConstInt   (0n,  mod))],
					[`?false;`, callUnaryOp(mod, 'iemp', buildConstInt   (0n,  mod))],
					[`?true;`,  callUnaryOp(mod, 'iemp', buildConstInt   (1n,  mod))],
					[`?42;`,    callUnaryOp(mod, 'iemp', buildConstInt   (42n, mod))],
					[`?4.2;`,   callUnaryOp(mod, 'femp', buildConstFloat (4.2, mod))],
					[`-(4);`,   callUnaryOp(mod, 'neg',  buildConstInt   (4n,  mod))],
					[`-(4.2);`, mod.f64.neg(buildConstFloat(4.2, mod))],
				]));
			});
			it('works with tuples.', () => {
				const src = `
					let unfixed x: int | float = 42;
					let unfixed y: int | float = 4.2;

					!x; % should return \`if i32.eqz(0) then $inot(42) else $fnot(0.0)\`
					!y; % should return \`if i32.eqz(1) then $inot(0)  else $fnot(4.2)\`

					?x; % should return \`if i32.eqz(0) then $iemp(42) else $femp(0.0)\`
					?y; % should return \`if i32.eqz(1) then $iemp(0)  else $femp(4.2)\`

					-x; % should return \`[0, $neg(42), f64.neg(0.0)]\`
					-y; % should return \`[1, $neg(0),  f64.neg(4.2)]\`
				`;
				const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(src);
				const builder               = new Builder(src);
				const mod: binaryen.Module  = builder.module;
				goal.varCheck();
				goal.typeCheck();
				goal.build(builder);
				const extracts: readonly BinEither[] = goal.children.slice(2).map((stmt) => new BinEither(
					builder.module,
					((stmt as AST.ASTNodeStatementExpression).expr as AST.ASTNodeOperationUnary).operand.build(builder),
				));
				return assertEqualBins(
					goal.children.slice(2).map((stmt) => stmt.build(builder)),
					[
						mod.if       (     mod.i32.eqz(extracts[0].side), callUnaryOp(mod, 'inot', extracts[0].left), callUnaryOp(mod, 'fnot', extracts[0].right)),
						mod.if       (     mod.i32.eqz(extracts[1].side), callUnaryOp(mod, 'inot', extracts[1].left), callUnaryOp(mod, 'fnot', extracts[1].right)),
						mod.if       (     mod.i32.eqz(extracts[2].side), callUnaryOp(mod, 'iemp', extracts[2].left), callUnaryOp(mod, 'femp', extracts[2].right)),
						mod.if       (     mod.i32.eqz(extracts[3].side), callUnaryOp(mod, 'iemp', extracts[3].left), callUnaryOp(mod, 'femp', extracts[3].right)),
						new BinEither(mod,             extracts[4].side,  callUnaryOp(mod, 'neg',  extracts[4].left), mod.f64.neg(             extracts[4].right)).make(),
						new BinEither(mod,             extracts[5].side,  callUnaryOp(mod, 'neg',  extracts[5].left), mod.f64.neg(             extracts[5].right)).make(),
					].map((expected) => builder.module.drop(expected)),
				);
			});
			it('multiple operations.', () => {
				const src = `
					let unfixed x: int | float = 42;
					let unfixed y: int | float = 4.2;

					!!x; % should return \`$inot(if i32.eqz(0) then $inot(42) else $fnot(0.0))\`
					??y; % should return \`$iemp(if i32.eqz(1) then $iemp(0)  else $femp(4.2))\`

					!-x; % should return \`if i32.eqz(extract 0 [0, $neg(42), f64.neg(0.0)]) then $inot(extract 1 [0, $neg(42), f64.neg(0.0)]) else $fnot(extract 2 [0, $neg(42), f64.neg(0.0)])\`
					?-y; % should return \`if i32.eqz(extract 0 [1, $neg(0),  f64.neg(4.2)]) then $iemp(extract 1 [1, $neg(0),  f64.neg(4.2)]) else $femp(extract 2 [1, $neg(0),  f64.neg(4.2)])\`
				`;
				const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(src);
				const builder               = new Builder(src);
				const mod: binaryen.Module  = builder.module;
				goal.varCheck();
				goal.typeCheck();
				goal.build(builder);
				const extracts: readonly BinEither[] = goal.children.slice(2).map((stmt) => new BinEither(
					builder.module,
					(((stmt as AST.ASTNodeStatementExpression).expr as AST.ASTNodeOperationUnary).operand as AST.ASTNodeOperationUnary).operand.build(builder),
				));
				const eithers = {
					x: new BinEither(mod, extracts[2].side, callUnaryOp(mod, 'neg', extracts[2].left), mod.f64.neg(extracts[2].right)).make(),
					y: new BinEither(mod, extracts[3].side, callUnaryOp(mod, 'neg', extracts[3].left), mod.f64.neg(extracts[3].right)).make(),
				} as const;
				return assertEqualBins(
					goal.children.slice(2).map((stmt) => stmt.build(builder)),
					[
						callUnaryOp(mod, 'inot', mod.if(mod.i32.eqz(extracts[0].side), callUnaryOp(mod, 'inot', extracts[0].left), callUnaryOp(mod, 'fnot', extracts[0].right))),
						callUnaryOp(mod, 'iemp', mod.if(mod.i32.eqz(extracts[1].side), callUnaryOp(mod, 'iemp', extracts[1].left), callUnaryOp(mod, 'femp', extracts[1].right))),

						mod.if(mod.i32.eqz(mod.tuple.extract(eithers.x, 0)), callUnaryOp(mod, 'inot', mod.tuple.extract(eithers.x, 1)), callUnaryOp(mod, 'fnot', mod.tuple.extract(eithers.x, 2))),
						mod.if(mod.i32.eqz(mod.tuple.extract(eithers.y, 0)), callUnaryOp(mod, 'iemp', mod.tuple.extract(eithers.y, 1)), callUnaryOp(mod, 'femp', mod.tuple.extract(eithers.y, 2))),
					].map((expected) => builder.module.drop(expected)),
				);
			});
		});
	});



	describe('ASTNodeOperationBinary', () => {
		describe('#build', () => {
			it('works with tuples.', () => {
				const src = `
					let unfixed x: int | float = 42;
					let unfixed y: int | float = 4.2;

					x * 2;   % should return \`[0, i32.mul(42, 2), f64.mul(0.0, c(2))]\`
					y * 2;   % should return \`[1, i32.mul(0,  2), f64.mul(4.2, c(2))]\`
					x * 2.4; % should return \`if i32.eqz(0) then f64.mul(c(42), 2.4) else f64.mul(0.0, 2.4)\`
					y * 2.4; % should return \`if i32.eqz(1) then f64.mul(c(0),  2.4) else f64.mul(4.2, 2.4)\`

					x < 2;   % should return \`if i32.eqz(0) then i32.lt_s(42, 2)    else f64.lt(0.0, c(2))\`
					y < 2;   % should return \`if i32.eqz(1) then i32.lt_s(0,  2)    else f64.lt(4.2, c(2))\`
					x < 2.4; % should return \`if i32.eqz(0) then f64.lt(c(42), 2.4) else f64.lt(0.0, 2.4)\`
					y < 2.4; % should return \`if i32.eqz(1) then f64.lt(c(0),  2.4) else f64.lt(4.2, 2.4)\`

					x == 2;   % should return \`if i32.eqz(0) then i32.eq(42, 2)      else f64.eq(0.0, c(2))]\`
					y == 2;   % should return \`if i32.eqz(1) then i32.eq(0,  2)      else f64.eq(4.2, c(2))]\`
					x == 2.4; % should return \`if i32.eqz(0) then f64.eq(c(42), 2.4) else f64.eq(0.0, 2.4)]\`
					y == 2.4; % should return \`if i32.eqz(1) then f64.eq(c(0),  2.4) else f64.eq(4.2, 2.4)]\`
				`;
				const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(src);
				const builder               = new Builder(src);
				const mod: binaryen.Module  = builder.module;
				goal.varCheck();
				goal.typeCheck();
				goal.build(builder);
				const extracts: readonly BinEither[] = goal.children.slice(2).map((stmt) => new BinEither(
					builder.module,
					((stmt as AST.ASTNodeStatementExpression).expr as AST.ASTNodeOperationBinary).operand0.build(builder),
				));
				const const_ = {
					'2':    buildConstInt   (2n,  mod),
					'2.4':  buildConstFloat (2.4, mod),
					'c(2)': buildConvert    (2n,  mod),
				} as const;
				return assertEqualBins(
					goal.children.slice(2).map((stmt) => stmt.build(builder)),
					[
						new BinEither(mod,             extracts[0].side,  mod.i32.mul(                      extracts[0].left,  const_['2']),   mod.f64.mul(extracts[0].right, const_['c(2)'])).make(),
						new BinEither(mod,             extracts[1].side,  mod.i32.mul(                      extracts[1].left,  const_['2']),   mod.f64.mul(extracts[1].right, const_['c(2)'])).make(),
						mod.if       (     mod.i32.eqz(extracts[2].side), mod.f64.mul(mod.f64.convert_u.i32(extracts[2].left), const_['2.4']), mod.f64.mul(extracts[2].right, const_['2.4'])),
						mod.if       (     mod.i32.eqz(extracts[3].side), mod.f64.mul(mod.f64.convert_u.i32(extracts[3].left), const_['2.4']), mod.f64.mul(extracts[3].right, const_['2.4'])),

						mod.if(mod.i32.eqz(extracts[4].side), mod.i32.lt_s (                      extracts[4].left,  const_['2']),   mod.f64.lt(extracts[4].right, const_['c(2)'])),
						mod.if(mod.i32.eqz(extracts[5].side), mod.i32.lt_s (                      extracts[5].left,  const_['2']),   mod.f64.lt(extracts[5].right, const_['c(2)'])),
						mod.if(mod.i32.eqz(extracts[6].side), mod.f64.lt   (mod.f64.convert_u.i32(extracts[6].left), const_['2.4']), mod.f64.lt(extracts[6].right, const_['2.4'])),
						mod.if(mod.i32.eqz(extracts[7].side), mod.f64.lt   (mod.f64.convert_u.i32(extracts[7].left), const_['2.4']), mod.f64.lt(extracts[7].right, const_['2.4'])),

						mod.if(mod.i32.eqz(extracts[ 8].side), mod.i32.eq(                      extracts[ 8].left,  const_['2']),   mod.f64.eq(extracts[ 8].right, const_['c(2)'])),
						mod.if(mod.i32.eqz(extracts[ 9].side), mod.i32.eq(                      extracts[ 9].left,  const_['2']),   mod.f64.eq(extracts[ 9].right, const_['c(2)'])),
						mod.if(mod.i32.eqz(extracts[10].side), mod.f64.eq(mod.f64.convert_u.i32(extracts[10].left), const_['2.4']), mod.f64.eq(extracts[10].right, const_['2.4'])),
						mod.if(mod.i32.eqz(extracts[11].side), mod.f64.eq(mod.f64.convert_u.i32(extracts[11].left), const_['2.4']), mod.f64.eq(extracts[11].right, const_['2.4'])),
					].map((expected) => builder.module.drop(expected)),
				);
			});
			it('multiple unions.', () => {
				const src = `
					let unfixed x: int | float = 42;
					let unfixed y: int | float = 4.2;

					x * y; %% should return \`[
						1,
						i32.mul(42, 0),
						if 1 then f64.mul(c(42), 4.2) else if 2 then f64.mul(0.0, c(0)) else f64.mul(0.0, 4.2),
					]\` %%

					x > y; %% should return \`[
						1,
						i32.gt_s(42, 0),
						if 1 then f64.gt(c(42), 4.2) else if 2 then f64.gt(0.0, c(0)) else f64.gt(0.0, 4.2),
					]\` %%

					x == y; %% should return \`[
						1,
						i32.eq(42, 0),
						if 1 then f64.eq(c(42), 4.2) else if 2 then f64.eq(0.0, c(0)) else f64.eq(0.0, 4.2),
					]\` %%
				`;
				const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(src);
				const builder               = new Builder(src);
				const mod: binaryen.Module  = builder.module;
				goal.varCheck();
				goal.typeCheck();
				goal.build(builder);
				const extracts: readonly (readonly BinEither[])[] = goal.children.slice(2).map((stmt) => {
					const binexp = (stmt as AST.ASTNodeStatementExpression).expr as AST.ASTNodeOperationBinary;
					return [
						binexp.operand0.build(builder),
						binexp.operand1.build(builder),
					].map((arg) => new BinEither(builder.module, arg));
				});
				const keys: readonly binaryen.ExpressionRef[] = extracts.map((extract) => mod.i32.add(mod.i32.mul(mod.i32.const(2), extract[0].side), extract[1].side));
				const each_options = [
					[
						mod.i32.mul(extracts[0][0].left,                        extracts[0][1].left),
						mod.f64.mul(mod.f64.convert_u.i32(extracts[0][0].left), extracts[0][1].right),
						mod.f64.mul(extracts[0][0].right,                       mod.f64.convert_u.i32(extracts[0][1].left)),
						mod.f64.mul(extracts[0][0].right,                       extracts[0][1].right),
					],
					[
						mod.i32.gt_s (extracts[1][0].left,                        extracts[1][1].left),
						mod.f64.gt   (mod.f64.convert_u.i32(extracts[1][0].left), extracts[1][1].right),
						mod.f64.gt   (extracts[1][0].right,                       mod.f64.convert_u.i32(extracts[1][1].left)),
						mod.f64.gt   (extracts[1][0].right,                       extracts[1][1].right),
					],
					[
						mod.i32.eq(extracts[2][0].left,                        extracts[2][1].left),
						mod.f64.eq(mod.f64.convert_u.i32(extracts[2][0].left), extracts[2][1].right),
						mod.f64.eq(extracts[2][0].right,                       mod.f64.convert_u.i32(extracts[2][1].left)),
						mod.f64.eq(extracts[2][0].right,                       extracts[2][1].right),
					],
				] as const;
				return assertEqualBins(
					goal.children.slice(2).map((stmt) => stmt.build(builder)),
					each_options.map((options, i) => builder.module.drop(new BinEither(
						mod,
						mod.i32.eqz(mod.i32.eq(keys[i], mod.i32.const(0))),
						options[0],
						mod.if(
							mod.i32.eq(keys[i], mod.i32.const(1)),
							options[1],
							mod.if(
								mod.i32.eq(keys[i], mod.i32.const(2)),
								options[2],
								options[3],
							),
						),
					).make())),
				);
			});
			it('multiple operations.', () => {
				const src = `
					let unfixed x: int | float = 42;
					let unfixed y: int | float = 4.2;

					x + 2 + 3; % should return \`[extract 0 [0, i32.add(42, 2), f64.add(0.0, c(2))], i32.add(extract 1 [0, i32.add(42, 2), f64.add(0.0, c(2))], 3), f64.add(extract 2 [0, i32.add(42, 2), f64.add(0.0, c(2))], c(3))]\`
					2 + y + 3; % should return \`[extract 0 [1, i32.add(2,  0), f64.add(c(2), 4.2)], i32.add(extract 1 [1, i32.add(2,  0), f64.add(c(2), 4.2)], 3), f64.add(extract 2 [1, i32.add(2,  0), f64.add(c(2), 4.2)], c(3))]\`
				`;
				const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(src);
				const builder               = new Builder(src);
				const mod: binaryen.Module  = builder.module;
				goal.varCheck();
				goal.typeCheck();
				goal.build(builder);
				const extracts: readonly BinEither[] = [
					(((goal.children[2] as AST.ASTNodeStatementExpression).expr as AST.ASTNodeOperationBinary).operand0 as AST.ASTNodeOperationBinary).operand0.build(builder),
					(((goal.children[3] as AST.ASTNodeStatementExpression).expr as AST.ASTNodeOperationBinary).operand0 as AST.ASTNodeOperationBinary).operand1.build(builder),
				].map((arg) => new BinEither(builder.module, arg));
				const const_ = {
					'2':    buildConstInt (2n, mod),
					'3':    buildConstInt (3n, mod),
					'c(2)': buildConvert  (2n, mod),
					'c(3)': buildConvert  (3n, mod),
				} as const;
				const eithers = {
					x: new BinEither(mod, extracts[0].side, mod.i32.add(extracts[0].left, const_['2']),      mod.f64.add(extracts[0].right, const_['c(2)'])).make(),
					y: new BinEither(mod, extracts[1].side, mod.i32.add(const_['2'],      extracts[1].left), mod.f64.add(const_['c(2)'],    extracts[1].right)).make(),
				} as const;
				return assertEqualBins(
					goal.children.slice(2).map((stmt) => stmt.build(builder)),
					[
						new BinEither(mod, mod.tuple.extract(eithers.x, 0), mod.i32.add(mod.tuple.extract(eithers.x, 1), const_['3']), mod.f64.add(mod.tuple.extract(eithers.x, 2), const_['c(3)'])),
						new BinEither(mod, mod.tuple.extract(eithers.y, 0), mod.i32.add(mod.tuple.extract(eithers.y, 1), const_['3']), mod.f64.add(mod.tuple.extract(eithers.y, 2), const_['c(3)'])),
					].map((expected) => builder.module.drop(expected.make())),
				);
			});
		});
	});



	describe('ASTNodeOperationBinaryArithmetic', () => {
		describe('#type', () => {
			context('with constant folding and int coersion on.', () => {
				it('returns a constant Integer type for any operation of integers.', () => {
					assert.deepStrictEqual(AST.ASTNodeOperationBinaryArithmetic.fromSource(`7 * 3 * 2;`).type(), typeConstInt(7n * 3n * 2n));
				});
				it('returns a constant Float type for any operation of mix of integers and floats.', () => {
					assert.deepStrictEqual(AST.ASTNodeOperationBinaryArithmetic.fromSource(`3.0 * 2.7;`)   .type(), typeConstFloat(3.0 * 2.7));
					assert.deepStrictEqual(AST.ASTNodeOperationBinaryArithmetic.fromSource(`7 * 3.0 * 2;`) .type(), typeConstFloat(7 * 3.0 * 2));
				});
			});
			context('with folding off but int coersion on.', () => {
				it('returns Integer for integer arithmetic.', () => {
					const node: AST.ASTNodeOperationBinaryArithmetic = AST.ASTNodeOperationBinaryArithmetic.fromSource(`(7 + 3) * 2;`, CONFIG_FOLDING_OFF);
					assert.deepStrictEqual(node.type(), SolidType.INT);
					assert.deepStrictEqual(
						[node.operand0.type(), node.operand1.type()],
						[SolidType.INT,        typeConstInt(2n)],
					);
				});
				it('returns Float for float arithmetic.', () => {
					const node: AST.ASTNodeOperationBinaryArithmetic = AST.ASTNodeOperationBinaryArithmetic.fromSource(`7 * 3.0 ^ 2;`, CONFIG_FOLDING_OFF);
					assert.deepStrictEqual(node.type(), SolidType.FLOAT);
					assert.deepStrictEqual(
						[node.operand0.type(), node.operand1.type()],
						[typeConstInt(7n),     SolidType.FLOAT],
					);
				});
			});
			context('with folding and int coersion off.', () => {
				it('returns `Integer` if both operands are ints.', () => {
					assert.deepStrictEqual(typeOfOperationFromSource(`7 * 3;`), SolidType.INT);
				})
				it('returns `Float` if both operands are floats.', () => {
					assert.deepStrictEqual(typeOfOperationFromSource(`7.0 - 3.0;`), SolidType.FLOAT);
				})
				it('throws TypeError for invalid type operations.', () => {
					assert.throws(() => typeOfOperationFromSource(`7.0 + 3;`), TypeError01);
				});
			});
			it('throws for arithmetic operation of non-numbers.', () => {
				[
					`null + 5;`,
					`5 * null;`,
					`false - 2;`,
					`2 / true;`,
					`null ^ false;`,
					...(Dev.supports('stringConstant-assess') ? [`'hello' + 5;`] : []),
				].forEach((src) => {
					assert.throws(() => AST.ASTNodeOperationBinaryArithmetic.fromSource(src).type(), TypeError01);
				});
			});
		});


		describe('#fold', () => {
			it('computes the value of an integer operation of constants.', () => {
				foldOperations(new Map([
					[`42 + 420;`,           new Int16(42n + 420n)],
					[`42 - 420;`,           new Int16(42n + -420n)],
					[` 126 /  3;`,          new Int16(BigInt(Math.trunc( 126 /  3)))],
					[`-126 /  3;`,          new Int16(BigInt(Math.trunc(-126 /  3)))],
					[` 126 / -3;`,          new Int16(BigInt(Math.trunc( 126 / -3)))],
					[`-126 / -3;`,          new Int16(BigInt(Math.trunc(-126 / -3)))],
					[` 200 /  3;`,          new Int16(BigInt(Math.trunc( 200 /  3)))],
					[` 200 / -3;`,          new Int16(BigInt(Math.trunc( 200 / -3)))],
					[`-200 /  3;`,          new Int16(BigInt(Math.trunc(-200 /  3)))],
					[`-200 / -3;`,          new Int16(BigInt(Math.trunc(-200 / -3)))],
					[`42 ^ 2 * 420;`,       new Int16((42n ** 2n * 420n) % (2n ** 16n))],
					[`2 ^ 15 + 2 ^ 14;`,    new Int16(-(2n ** 14n))],
					[`-(2 ^ 14) - 2 ^ 15;`, new Int16(2n ** 14n)],
					[`-(5) ^ +(2 * 3);`,    new Int16((-5n) ** (2n * 3n))],
				]));
			});
			it('overflows integers properly.', () => {
				assert.deepStrictEqual([
					`2 ^ 15 + 2 ^ 14;`,
					`-(2 ^ 14) - 2 ^ 15;`,
				].map((src) => AST.ASTNodeOperationBinaryArithmetic.fromSource(src).fold()), [
					new Int16(-(2n ** 14n)),
					new Int16(2n ** 14n),
				]);
			});
			it('computes the value of a float operation of constants.', () => {
				foldOperations(new Map<string, SolidObject>([
					[`3.0e1 - 201.0e-1;`, new Float64(30 - 20.1)],
					[`3 * 2.1;`,          new Float64(3 * 2.1)],
				]));
			});
			it('throws when performing an operation that does not yield a valid number.', () => {
				assert.throws(() => AST.ASTNodeOperationBinaryArithmetic.fromSource(`42 / 0;`)   .fold(), NanError02);
				assert.throws(() => AST.ASTNodeOperationBinaryArithmetic.fromSource(`-4 ^ -0.5;`).fold(), NanError01);
			});
		});


		describe('#build', () => {
			it('returns the correct operation.', () => {
				const mod = new binaryen.Module();
				return buildOperations(new Map<string, binaryen.ExpressionRef>([
					['42 + 420;', mod.i32.add(buildConstInt (42n, mod), buildConstInt   (420n, mod))],
					['3 * 2.1;',  mod.f64.mul(buildConvert  (3n,  mod), buildConstFloat (2.1,  mod))],

					[' 126 /  3;', mod.i32.div_s(buildConstInt( 126n, mod), buildConstInt( 3n, mod))],
					['-126 /  3;', mod.i32.div_s(buildConstInt(-126n, mod), buildConstInt( 3n, mod))],
					[' 126 / -3;', mod.i32.div_s(buildConstInt( 126n, mod), buildConstInt(-3n, mod))],
					['-126 / -3;', mod.i32.div_s(buildConstInt(-126n, mod), buildConstInt(-3n, mod))],
					[' 200 /  3;', mod.i32.div_s(buildConstInt( 200n, mod), buildConstInt( 3n, mod))],
					[' 200 / -3;', mod.i32.div_s(buildConstInt( 200n, mod), buildConstInt(-3n, mod))],
					['-200 /  3;', mod.i32.div_s(buildConstInt(-200n, mod), buildConstInt( 3n, mod))],
					['-200 / -3;', mod.i32.div_s(buildConstInt(-200n, mod), buildConstInt(-3n, mod))],
				]));
			});
		});
	});



	describe('ASTNodeOperationBinaryComparative', () => {
		describe('#type', () => {
			it('with folding and int coersion on.', () => {
				typeOperations(new Map([
					[`2 < 3;`,  SolidBoolean.TRUE],
					[`2 > 3;`,  SolidBoolean.FALSE],
					[`2 <= 3;`, SolidBoolean.TRUE],
					[`2 >= 3;`, SolidBoolean.FALSE],
					[`2 !< 3;`, SolidBoolean.FALSE],
					[`2 !> 3;`, SolidBoolean.TRUE],
				]));
			});
			context('with folding off but int coersion on.', () => {
				it('allows coercing of ints to floats if there are any floats.', () => {
					assert.deepStrictEqual(AST.ASTNodeOperationBinaryComparative.fromSource(`7.0 > 3;`, CONFIG_FOLDING_OFF).type(), SolidType.BOOL);
				});
			});
			context('with folding and int coersion off.', () => {
				it('returns `Boolean` if both operands are of the same numeric type.', () => {
					assert.deepStrictEqual(typeOfOperationFromSource(`7 < 3;`), SolidType.BOOL);
					assert.deepStrictEqual(typeOfOperationFromSource(`7.0 >= 3.0;`), SolidType.BOOL);
				});
				it('throws TypeError if operands have different types.', () => {
					assert.throws(() => typeOfOperationFromSource(`7.0 <= 3;`), TypeError01);
				});
			});
			it('throws for comparative operation of non-numbers.', () => {
				assert.throws(() => AST.ASTNodeOperationBinaryComparative.fromSource(`7.0 <= null;`).type(), TypeError01);
			});
		});


		specify('#fold', () => {
			foldOperations(new Map([
				[`3 <  3;`,     SolidBoolean.FALSE],
				[`3 >  3;`,     SolidBoolean.FALSE],
				[`3 <= 3;`,     SolidBoolean.TRUE],
				[`3 >= 3;`,     SolidBoolean.TRUE],
				[`5.2 <  7.0;`, SolidBoolean.TRUE],
				[`5.2 >  7.0;`, SolidBoolean.FALSE],
				[`5.2 <= 7.0;`, SolidBoolean.TRUE],
				[`5.2 >= 7.0;`, SolidBoolean.FALSE],
				[`5.2 <  9;`,   SolidBoolean.TRUE],
				[`5.2 >  9;`,   SolidBoolean.FALSE],
				[`5.2 <= 9;`,   SolidBoolean.TRUE],
				[`5.2 >= 9;`,   SolidBoolean.FALSE],
				[`5 <  9.2;`,   SolidBoolean.TRUE],
				[`5 >  9.2;`,   SolidBoolean.FALSE],
				[`5 <= 9.2;`,   SolidBoolean.TRUE],
				[`5 >= 9.2;`,   SolidBoolean.FALSE],
				[`3.0 <  3;`,   SolidBoolean.FALSE],
				[`3.0 >  3;`,   SolidBoolean.FALSE],
				[`3.0 <= 3;`,   SolidBoolean.TRUE],
				[`3.0 >= 3;`,   SolidBoolean.TRUE],
				[`3 <  3.0;`,   SolidBoolean.FALSE],
				[`3 >  3.0;`,   SolidBoolean.FALSE],
				[`3 <= 3.0;`,   SolidBoolean.TRUE],
				[`3 >= 3.0;`,   SolidBoolean.TRUE],
			]));
		});


		describe('#build', () => {
			it('returns the correct operation.', () => {
				const mod = new binaryen.Module();
				return buildOperations(new Map<string, binaryen.ExpressionRef>([
					['3   <  3;',   mod.i32.lt_s (buildConstInt   (3n,  mod), buildConstInt   (3n,  mod))],
					['3   >  3;',   mod.i32.gt_s (buildConstInt   (3n,  mod), buildConstInt   (3n,  mod))],
					['3   <= 3;',   mod.i32.le_s (buildConstInt   (3n,  mod), buildConstInt   (3n,  mod))],
					['3   >= 3;',   mod.i32.ge_s (buildConstInt   (3n,  mod), buildConstInt   (3n,  mod))],
					['5   <  9.2;', mod.f64.lt   (buildConvert    (5n,  mod), buildConstFloat (9.2, mod))],
					['5   >  9.2;', mod.f64.gt   (buildConvert    (5n,  mod), buildConstFloat (9.2, mod))],
					['5   <= 9.2;', mod.f64.le   (buildConvert    (5n,  mod), buildConstFloat (9.2, mod))],
					['5   >= 9.2;', mod.f64.ge   (buildConvert    (5n,  mod), buildConstFloat (9.2, mod))],
					['5.2 <  3;',   mod.f64.lt   (buildConstFloat (5.2, mod), buildConvert    (3n,  mod))],
					['5.2 >  3;',   mod.f64.gt   (buildConstFloat (5.2, mod), buildConvert    (3n,  mod))],
					['5.2 <= 3;',   mod.f64.le   (buildConstFloat (5.2, mod), buildConvert    (3n,  mod))],
					['5.2 >= 3;',   mod.f64.ge   (buildConstFloat (5.2, mod), buildConvert    (3n,  mod))],
					['5.2 <  9.2;', mod.f64.lt   (buildConstFloat (5.2, mod), buildConstFloat (9.2, mod))],
					['5.2 >  9.2;', mod.f64.gt   (buildConstFloat (5.2, mod), buildConstFloat (9.2, mod))],
					['5.2 <= 9.2;', mod.f64.le   (buildConstFloat (5.2, mod), buildConstFloat (9.2, mod))],
					['5.2 >= 9.2;', mod.f64.ge   (buildConstFloat (5.2, mod), buildConstFloat (9.2, mod))],
				]));
			});
		});
	});



	describe('ASTNodeOperationBinaryEquality', () => {
		describe('#type', () => {
			context('with folding and int coersion on.', () => {
				it('for numeric literals.', () => {
					typeOperations(new Map([
						[`2 === 3;`,      SolidBoolean.FALSE],
						[`2 !== 3;`,      SolidBoolean.TRUE],
						[`2 == 3;`,       SolidBoolean.FALSE],
						[`2 != 3;`,       SolidBoolean.TRUE],
						[`0 === -0;`,     SolidBoolean.TRUE],
						[`0 == -0;`,      SolidBoolean.TRUE],
						[`0.0 === 0;`,    SolidBoolean.FALSE],
						[`0.0 == 0;`,     SolidBoolean.TRUE],
						[`0.0 === -0;`,   SolidBoolean.FALSE],
						[`0.0 == -0;`,    SolidBoolean.TRUE],
						[`-0.0 === 0;`,   SolidBoolean.FALSE],
						[`-0.0 == 0;`,    SolidBoolean.TRUE],
						[`-0.0 === 0.0;`, SolidBoolean.FALSE],
						[`-0.0 == 0.0;`,  SolidBoolean.TRUE],
					]));
				});
				it('returns the result of `this#fold`, wrapped in a `new SolidTypeUnit`.', () => {
					const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
						let a: obj = [];
						let b: obj = [42];
						let c: obj = [x= 42];
						let d: obj = {41 -> 42};
						a !== [];
						b !== [42];
						c !== [x= 42];
						d !== {41 -> 42};
						a === a;
						b === b;
						c === c;
						d === d;
						a == [];
						b == [42];
						c == [x= 42];
						d == {41 -> 42};
						b != [42, 43];
						c != [x= 43];
						c != [y= 42];
						d != {41 -> 43};
						d != {43 -> 42};
					`);
					goal.varCheck();
					goal.typeCheck();
					goal.children.slice(4).forEach((stmt) => {
						const expr: AST.ASTNodeOperationBinaryEquality = (stmt as AST.ASTNodeStatementExpression).expr as AST.ASTNodeOperationBinaryEquality;
						assert.deepStrictEqual(
							expr.type(),
							new SolidTypeUnit(expr.fold()!),
						);
					});
				});
			});
			context('with folding off but int coersion on.', () => {
				it('allows coercing of ints to floats if there are any floats.', () => {
					assert.deepStrictEqual(AST.ASTNodeOperationBinaryEquality.fromSource(`7 == 7.0;`, CONFIG_FOLDING_OFF).type(), SolidType.BOOL);
				});
				it('returns `false` if operands are of different numeric types.', () => {
					assert.deepStrictEqual(AST.ASTNodeOperationBinaryEquality.fromSource(`7 === 7.0;`, CONFIG_FOLDING_OFF).type(), SolidBoolean.FALSETYPE);
				});
			});
			context('with folding and int coersion off.', () => {
				it('returns `false` if operands are of different numeric types.', () => {
					assert.deepStrictEqual(typeOfOperationFromSource(`7 == 7.0;`), SolidBoolean.FALSETYPE);
				});
				it('returns `false` if operands are of disjoint types in general.', () => {
					assert.deepStrictEqual(typeOfOperationFromSource(`7 == null;`), SolidBoolean.FALSETYPE);
				});
			});
		});


		describe('#fold', () => {
			it('simple types.', () => {
				foldOperations(new Map([
					[`null === null;`, SolidBoolean.TRUE],
					[`null ==  null;`, SolidBoolean.TRUE],
					[`null === 5;`,    SolidBoolean.FALSE],
					[`null ==  5;`,    SolidBoolean.FALSE],
					[`true === 1;`,    SolidBoolean.FALSE],
					[`true ==  1;`,    SolidBoolean.FALSE],
					[`true === 1.0;`,  SolidBoolean.FALSE],
					[`true ==  1.0;`,  SolidBoolean.FALSE],
					[`true === 5.1;`,  SolidBoolean.FALSE],
					[`true ==  5.1;`,  SolidBoolean.FALSE],
					[`true === true;`, SolidBoolean.TRUE],
					[`true ==  true;`, SolidBoolean.TRUE],
					[`3.0 === 3;`,     SolidBoolean.FALSE],
					[`3.0 ==  3;`,     SolidBoolean.TRUE],
					[`3 === 3.0;`,     SolidBoolean.FALSE],
					[`3 ==  3.0;`,     SolidBoolean.TRUE],
					[`0.0 === 0.0;`,   SolidBoolean.TRUE],
					[`0.0 ==  0.0;`,   SolidBoolean.TRUE],
					[`0.0 === -0.0;`,  SolidBoolean.FALSE],
					[`0.0 ==  -0.0;`,  SolidBoolean.TRUE],
					[`0 === -0;`,      SolidBoolean.TRUE],
					[`0 ==  -0;`,      SolidBoolean.TRUE],
					[`0.0 === 0;`,     SolidBoolean.FALSE],
					[`0.0 ==  0;`,     SolidBoolean.TRUE],
					[`0.0 === -0;`,    SolidBoolean.FALSE],
					[`0.0 ==  -0;`,    SolidBoolean.TRUE],
					[`-0.0 === 0;`,    SolidBoolean.FALSE],
					[`-0.0 ==  0;`,    SolidBoolean.TRUE],
					[`-0.0 === 0.0;`,  SolidBoolean.FALSE],
					[`-0.0 ==  0.0;`,  SolidBoolean.TRUE],
				]));
				Dev.supports('stringConstant-assess') && foldOperations(new Map([
					[`'' == '';`,                               SolidBoolean.TRUE],
					[`'a' === 'a';`,                            SolidBoolean.TRUE],
					[`'a' ==  'a';`,                            SolidBoolean.TRUE],
					[`'hello\\u{20}world' === 'hello world';`,  SolidBoolean.TRUE],
					[`'hello\\u{20}world' ==  'hello world';`,  SolidBoolean.TRUE],
					[`'a' !== 'b';`,                            SolidBoolean.TRUE],
					[`'a' !=  'b';`,                            SolidBoolean.TRUE],
					[`'hello\\u{20}world' !== 'hello20world';`, SolidBoolean.TRUE],
					[`'hello\\u{20}world' !=  'hello20world';`, SolidBoolean.TRUE],
				]));
			});
			it('compound types.', () => {
				const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
					let a: obj = [];
					let b: obj = [42];
					let c: obj = [x= 42];
					let d: obj = List.<int>([]);
					let e: obj = List.<int>([42]);
					let f: obj = Dict.<int>([x= 42]);
					let g: obj = {};
					let h: obj = {42};
					let i: obj = {41 -> 42};

					let bb: obj = [[42]];
					let cc: obj = [x= [42]];
					let hh: obj = {[42]};
					let ii: obj = {[41] -> [42]};

					a !== [];
					b !== [42];
					c !== [x= 42];
					d !== List.<int>([]);
					e !== List.<int>([42]);
					f !== Dict.<int>([x= 42]);
					g !== {};
					h !== {42};
					i !== {41 -> 42};
					a === a;
					b === b;
					c === c;
					d === d;
					e === e;
					f === f;
					g === g;
					h === h;
					i === i;
					a == [];
					b == [42];
					c == [x= 42];
					d == List.<int>([]);
					e == List.<int>([42]);
					f == Dict.<int>([x= 42]);
					g == {};
					h == {42};
					i == {41 -> 42};

					bb !== [[42]];
					cc !== [x= [42]];
					hh !== {[42]};
					ii !== {[41] -> [42]};
					bb === bb;
					cc === cc;
					hh === hh;
					ii === ii;
					bb == [[42]];
					cc == [x= [42]];
					hh == {[42]};
					ii == {[41] -> [42]};

					b != [42, 43];
					c != [x= 43];
					c != [y= 42];
					i != {41 -> 43};
					i != {43 -> 42};
				`);
				goal.varCheck();
				goal.typeCheck();
				goal.children.slice(13).forEach((stmt) => {
					assert.deepStrictEqual((stmt as AST.ASTNodeStatementExpression).expr!.fold(), SolidBoolean.TRUE, stmt.source);
				});
			});
		});


		describe('#build', () => {
			it('with int coercion on, coerces ints into floats when needed.', () => {
				const mod = new binaryen.Module();
				return buildOperations(new Map<string, binaryen.ExpressionRef>([
					['42 === 420;', mod.i32.eq (           buildConstInt (42n, mod), buildConstInt   (420n, mod))],
					['42 ==  420;', mod.i32.eq (           buildConstInt (42n, mod), buildConstInt   (420n, mod))],
					['42 === 4.2;', mod.call   ('i_f_id', [buildConstInt (42n, mod), buildConstFloat (4.2,  mod)], binaryen.i32)],
					['42 ==  4.2;', mod.f64.eq (           buildConvert  (42n, mod), buildConstFloat (4.2,  mod))],

					['4.2 === 42;',   mod.call   ('f_i_id', [buildConstFloat(4.2, mod), buildConstInt   (42n,  mod)], binaryen.i32)],
					['4.2 ==  42;',   mod.f64.eq (           buildConstFloat(4.2, mod), buildConvert    (42n,  mod))],
					['4.2 === 42.0;', mod.call   ('fid',    [buildConstFloat(4.2, mod), buildConstFloat (42.0, mod)], binaryen.i32)],
					['4.2 ==  42.0;', mod.f64.eq (           buildConstFloat(4.2, mod), buildConstFloat (42.0, mod))],

					['null === 0;',   mod.i32.eq (           buildConstInt (0n, mod), buildConstInt   (0n,  mod))],
					['null ==  0;',   mod.i32.eq (           buildConstInt (0n, mod), buildConstInt   (0n,  mod))],
					['null === 0.0;', mod.call   ('i_f_id', [buildConstInt (0n, mod), buildConstFloat (0.0, mod)], binaryen.i32)],
					['null ==  0.0;', mod.f64.eq (           buildConvert  (0n, mod), buildConstFloat (0.0, mod))],

					['false === 0;',   mod.i32.eq (           buildConstInt (0n, mod), buildConstInt  (0n,  mod))],
					['false ==  0;',   mod.i32.eq (           buildConstInt (0n, mod), buildConstInt  (0n,  mod))],
					['false === 0.0;', mod.call   ('i_f_id', [buildConstInt (0n, mod), buildConstFloat(0.0, mod)], binaryen.i32)],
					['false ==  0.0;', mod.f64.eq (           buildConvert  (0n, mod), buildConstFloat(0.0, mod))],

					['true === 1;',   mod.i32.eq (           buildConstInt (1n, mod), buildConstInt   (1n,  mod))],
					['true ==  1;',   mod.i32.eq (           buildConstInt (1n, mod), buildConstInt   (1n,  mod))],
					['true === 1.0;', mod.call   ('i_f_id', [buildConstInt (1n, mod), buildConstFloat (1.0, mod)], binaryen.i32)],
					['true ==  1.0;', mod.f64.eq (           buildConvert  (1n, mod), buildConstFloat (1.0, mod))],

					['null === false;', mod.i32.eq(buildConstInt(0n, mod), buildConstInt(0n, mod))],
					['null ==  false;', mod.i32.eq(buildConstInt(0n, mod), buildConstInt(0n, mod))],
					['null === true;',  mod.i32.eq(buildConstInt(0n, mod), buildConstInt(1n, mod))],
					['null ==  true;',  mod.i32.eq(buildConstInt(0n, mod), buildConstInt(1n, mod))],
				]));
			});
			it('with int coercion off, does not coerce ints into floats.', () => {
				const mod = new binaryen.Module();
				return buildOperations(new Map<string, binaryen.ExpressionRef>([
					['42 === 4.2;', mod.call('i_f_id', [buildConstInt(42n, mod), buildConstFloat(4.2, mod)], binaryen.i32)],
					['42 ==  4.2;', mod.call('i_f_id', [buildConstInt(42n, mod), buildConstFloat(4.2, mod)], binaryen.i32)],

					['4.2 === 42;',   mod.call('f_i_id', [buildConstFloat(4.2, mod), buildConstInt(42n, mod)], binaryen.i32)],
					['4.2 ==  42;',   mod.call('f_i_id', [buildConstFloat(4.2, mod), buildConstInt(42n, mod)], binaryen.i32)],

					['null === 0.0;', mod.call('i_f_id', [buildConstInt(0n, mod), buildConstFloat(0.0, mod)], binaryen.i32)],
					['null ==  0.0;', mod.call('i_f_id', [buildConstInt(0n, mod), buildConstFloat(0.0, mod)], binaryen.i32)],

					['false === 0.0;', mod.call('i_f_id', [buildConstInt(0n, mod), buildConstFloat(0.0, mod)], binaryen.i32)],
					['false ==  0.0;', mod.call('i_f_id', [buildConstInt(0n, mod), buildConstFloat(0.0, mod)], binaryen.i32)],

					['true === 1.0;', mod.call('i_f_id', [buildConstInt(1n, mod), buildConstFloat(1.0, mod)], binaryen.i32)],
					['true ==  1.0;', mod.call('i_f_id', [buildConstInt(1n, mod), buildConstFloat(1.0, mod)], binaryen.i32)],
				]), CONFIG_FOLDING_COERCION_OFF);
			});
		});
	});



	describe('ASTNodeOperationBinaryLogical', () => {
		describe('#type', () => {
			it('with constant folding on.', () => {
				typeOperations(new Map<string, SolidObject>([
					[`null  && false;`, SolidNull.NULL],
					[`false && null;`,  SolidBoolean.FALSE],
					[`true  && null;`,  SolidNull.NULL],
					[`false && 42;`,    SolidBoolean.FALSE],
					[`4.2   && true;`,  SolidBoolean.TRUE],
					[`null  || false;`, SolidBoolean.FALSE],
					[`false || null;`,  SolidNull.NULL],
					[`true  || null;`,  SolidBoolean.TRUE],
					[`false || 42;`,    new Int16(42n)],
					[`4.2   || true;`,  new Float64(4.2)],
				]));
			});
			context('with constant folding off.', () => {
				describe('[operator=AND]', () => {
					it('returns `left` if it’s a subtype of `void | null | false`.', () => {
						const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
							let unfixed a: null = null;
							let unfixed b: null | false = null;
							let unfixed c: null | void = null;
							a && 42;
							b && 42;
							c && 42;
						`, CONFIG_FOLDING_OFF);
						goal.varCheck();
						goal.typeCheck();
						assert.deepStrictEqual(goal.children.slice(3).map((stmt) => typeOfStmtExpr(stmt)), [
							SolidType.NULL,
							SolidType.NULL.union(SolidBoolean.FALSETYPE),
							SolidType.NULL.union(SolidType.VOID),
						]);
					});
					it('returns `T | right` if left is a supertype of `T narrows void | null | false`.', () => {
						const hello: SolidTypeUnit<SolidString> = typeConstStr('hello');
						const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
							let unfixed a: null | int = null;
							let unfixed b: null | int = 42;
							let unfixed c: bool = false;
							let unfixed d: bool | float = 4.2;
							let unfixed e: str | void = 'hello';
							a && 'hello';
							b && 'hello';
							c && 'hello';
							d && 'hello';
							e && 42;
						`, CONFIG_FOLDING_OFF);
						goal.varCheck();
						goal.typeCheck();
						assert.deepStrictEqual(goal.children.slice(5).map((stmt) => typeOfStmtExpr(stmt)), [
							SolidType.NULL.union(hello),
							SolidType.NULL.union(hello),
							SolidBoolean.FALSETYPE.union(hello),
							SolidBoolean.FALSETYPE.union(hello),
							SolidType.VOID.union(typeConstInt(42n)),
						]);
					});
					it('returns `right` if left does not contain `void` nor `null` nor `false`.', () => {
						const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
							let unfixed a: int = 42;
							let unfixed b: float = 4.2;
							a && true;
							b && null;
						`, CONFIG_FOLDING_OFF);
						goal.varCheck();
						goal.typeCheck();
						assert.deepStrictEqual(goal.children.slice(2).map((stmt) => typeOfStmtExpr(stmt)), [
							SolidBoolean.TRUETYPE,
							SolidType.NULL,
						]);
					});
				});
				describe('[operator=OR]', () => {
					it('returns `right` if it’s a subtype of `void | null | false`.', () => {
						const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
							let unfixed a: null = null;
							let unfixed b: null | false = null;
							let unfixed c: null | void = null;
							a || false;
							b || 42;
							c || 4.2;
						`, CONFIG_FOLDING_OFF);
						goal.varCheck();
						goal.typeCheck();
						assert.deepStrictEqual(goal.children.slice(3).map((stmt) => typeOfStmtExpr(stmt)), [
							SolidBoolean.FALSETYPE,
							typeConstInt(42n),
							typeConstFloat(4.2),
						]);
					});
					it('returns `(left - T) | right` if left is a supertype of `T narrows void | null | false`.', () => {
						const hello: SolidTypeUnit<SolidString> = typeConstStr('hello');
						const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
							let unfixed a: null | int = null;
							let unfixed b: null | int = 42;
							let unfixed c: bool = false;
							let unfixed d: bool | float = 4.2;
							let unfixed e: str | void = 'hello';
							a || 'hello';
							b || 'hello';
							c || 'hello';
							d || 'hello';
							e || 42;
						`, CONFIG_FOLDING_OFF);
						goal.varCheck();
						goal.typeCheck();
						assertEqualTypes(goal.children.slice(5).map((stmt) => typeOfStmtExpr(stmt)), [
							SolidType.INT.union(hello),
							SolidType.INT.union(hello),
							SolidBoolean.TRUETYPE.union(hello),
							SolidBoolean.TRUETYPE.union(SolidType.FLOAT).union(hello),
							SolidType.STR.union(typeConstInt(42n)),
						]);
					});
					it('returns `left` if it does not contain `void` nor `null` nor `false`.', () => {
						const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
							let unfixed a: int = 42;
							let unfixed b: float = 4.2;
							a || true;
							b || null;
						`, CONFIG_FOLDING_OFF);
						goal.varCheck();
						goal.typeCheck();
						assert.deepStrictEqual(goal.children.slice(2).map((stmt) => typeOfStmtExpr(stmt)), [
							SolidType.INT,
							SolidType.FLOAT,
						]);
					});
				});
			});
		});


		specify('#fold', () => {
			foldOperations(new Map<string, SolidObject>([
				[`null && 5;`,     SolidNull.NULL],
				[`null || 5;`,     new Int16(5n)],
				[`5 && null;`,     SolidNull.NULL],
				[`5 || null;`,     new Int16(5n)],
				[`5.1 && true;`,   SolidBoolean.TRUE],
				[`5.1 || true;`,   new Float64(5.1)],
				[`3.1 && 5;`,      new Int16(5n)],
				[`3.1 || 5;`,      new Float64(3.1)],
				[`false && null;`, SolidBoolean.FALSE],
				[`false || null;`, SolidNull.NULL],
			]));
		});


		describe('#build', () => {
			/**
			 * A helper for creating a conditional expression.
			 * Given a value to tee and a callback to perform giving the branches,
			 * return an `(if)` whose condition is the double-negated teed variable
			 * and whose branches are given by the callback.
			 * @param mod      the module to perform the conditional
			 * @param tee      parameters for teeing the value:
			 *                 [
			 *                 	the local index to tee the value,
			 *                 	the value,
			 *                 	the value’s type,
			 *                 ]
			 * @param branches the callback to perform; given a getter, returns two branches: [if_true, if_false]
			 * @return         the new `(if)` expression
			 */
			function create_if(
				mod:                binaryen.Module,
				[index, arg, type]: [index: number, arg: binaryen.ExpressionRef, type: binaryen.Type],
				branches:           (local_get: binaryen.ExpressionRef) => [binaryen.ExpressionRef, binaryen.ExpressionRef],
			): binaryen.ExpressionRef {
				const local_get: binaryen.ExpressionRef = mod.local.get(index, type);
				return mod.if(
					mod.i32.eqz(mod.call(
						(type === binaryen.i32) ? 'inot' : 'fnot',
						[mod.local.tee(index, arg, type)],
						binaryen.i32,
					)),
					...branches.call(null, local_get),
				);
			}
			it('returns a special case of `(if)`.', () => {
				const mod = new binaryen.Module();
				return buildOperations(new Map<string, binaryen.ExpressionRef>([
					['42 && 420;', create_if(
						mod,
						[0, buildConstInt(42n, mod), binaryen.i32],
						(getter) => [buildConstInt(420n, mod), getter],
					)],
					['4.2 || -420;', create_if(
						mod,
						[0, buildConstFloat(4.2, mod), binaryen.f64],
						(getter) => [getter, buildConvert(-420n, mod)],
					)],
					['null && 201.0e-1;', create_if(
						mod,
						[0, buildConstInt(0n, mod), binaryen.i32],
						(getter) => [buildConstFloat(20.1, mod), mod.f64.convert_u.i32(getter)],
					)],
					['true && 201.0e-1;', create_if(
						mod,
						[0, buildConstInt(1n, mod), binaryen.i32],
						(getter) => [buildConstFloat(20.1, mod), mod.f64.convert_u.i32(getter)],
					)],
					['false || null;', create_if(
						mod,
						[0, buildConstInt(0n, mod), binaryen.i32],
						(getter) => [getter, buildConstInt(0n, mod)],
					)],
				]));
			});
			it('counts internal variables correctly.', () => {
				const mod = new binaryen.Module();
				return buildOperations(new Map<string, binaryen.ExpressionRef>([
					['1 && 2 || 3 && 4;', create_if(
						mod,
						[2, create_if(
							mod,
							[0, buildConstInt(1n, mod), binaryen.i32],
							(getter) => [buildConstInt(2n, mod), getter],
						), binaryen.i32],
						(getter) => [getter, create_if(
							mod,
							[1, buildConstInt(3n, mod), binaryen.i32],
							(getter) => [buildConstInt(4n, mod), getter],
						)],
					)],
				]), CONFIG_FOLDING_OFF);
			});
		});
	});



	describe('ASTNodeOperationTernary', () => {
		describe('#type', () => {
			context('with constant folding on', () => {
				it('computes type for for conditionals', () => {
					typeOperations(new Map<string, SolidObject>([
						[`if true then false else 2;`,          SolidBoolean.FALSE],
						[`if false then 3.0 else null;`,        SolidNull.NULL],
						[`if true then 2 else 3.0;`,            new Int16(2n)],
						[`if false then 2 + 3.0 else 1.0 * 2;`, new Float64(2.0)],
					]));
				});
			});
			it('throws when condition is not boolean.', () => {
				assert.throws(() => AST.ASTNodeOperationTernary.fromSource(`if 2 then true else false;`).type(), TypeError01);
			});
		});


		specify('#fold', () => {
			foldOperations(new Map<string, SolidObject>([
				[`if true then false else 2;`,          SolidBoolean.FALSE],
				[`if false then 3.0 else null;`,        SolidNull.NULL],
				[`if true then 2 else 3.0;`,            new Int16(2n)],
				[`if false then 2 + 3.0 else 1.0 * 2;`, new Float64(2.0)],
			]));
		});


		describe('#build', () => {
			it('returns `(mod.if)`.', () => {
				const mod = new binaryen.Module();
				return buildOperations(new Map<string, binaryen.ExpressionRef>([
					['if true  then false else 2;',    mod.if(buildConstInt(1n, mod), buildConstInt   (0n,  mod), buildConstInt   (2n,  mod))],
					['if false then 3.0   else null;', mod.if(buildConstInt(0n, mod), buildConstFloat (3.0, mod), buildConvert    (0n,  mod))],
					['if true  then 2     else 3.0;',  mod.if(buildConstInt(1n, mod), buildConvert    (2n,  mod), buildConstFloat (3.0, mod))],
				]));
			});
		});
	});
});
