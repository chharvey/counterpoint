import * as assert from 'node:assert';
import * as test from 'node:test';
import * as xjs from 'extrajs';
import {
	VALUE,
	TYPE,
	Validator,
	AST,
	SymbolSchemaType,
	SymbolSchemaVar,
	ReferenceErrorUndeclared,
	ReferenceErrorDeadZone,
	ReferenceErrorKind,
	AssignmentErrorDuplicateDeclaration,
	AssignmentErrorDuplicateKey,
	TypeErrorInvalidOperation,
	TypeErrorNotAssignable,
} from '../../src/index.ts';
import {
	extract_tokens,
	extract_lines,
	repeat,
	assert_shallowStrictEqual,
	assertAssignable,
	assertEqualTypes,
	typeUnit,
	setupScript,
} from '../utils.ts';



test.suite('Expression', () => {
	test.suite('#varCheck', () => {
		test.suite('ExpressionFunction (and DeclarationFunction)', () => {
			test.test('disallows duplicate param keys.', () => {
				const {stmts} = setupScript(`{
					\\(a= b: int, a= c: float): void { return; };
					\\($a: int, a= c: float): void { return; };
				}`, {varCheck: false});
				const fn0 = (stmts[0] as AST.STMT.StatementExpression).expr as AST.EXPR.Function;
				const fn1 = (stmts[1] as AST.STMT.StatementExpression).expr as AST.EXPR.Function;
				assert.throws(() => fn0.varCheck(), AssignmentErrorDuplicateKey);
				return assert.throws(() => fn1.varCheck(), AssignmentErrorDuplicateKey);
			});
			test.test('throws when capture is not declared.', () => {
				const {stmts} = setupScript(`{
					\\() with (x): void { return; };
				}`, {varCheck: false});
				return assert.throws(() => stmts[0].varCheck(), ReferenceErrorUndeclared);
			});
			test.test('disallows duplicate captures.', () => {
				const {stmts} = setupScript(`{
					val x: int = 42;
					\\() with (x, x): void { return; };
				}`, {varCheck: false});
				stmts[0].varCheck();
				const fn0 = (stmts[1] as AST.STMT.StatementExpression).expr as AST.EXPR.Function;
				return assert.throws(() => fn0.varCheck(), AssignmentErrorDuplicateDeclaration);
			});
		});
	});



	test.suite('#type', () => {
		test.suite('Variable', () => {
			test.test('wraps in `Maybe` when accessed variable is uninitialized.', () => {
				const {stmts} = setupScript(`{
					val mut w:  int = 42;
					val mut x?: int;
					w;
					x;
				}`, {build: false});
				assert.ok( (stmts[0] as AST.STMT.DeclarationVariable).assigned);
				assert.ok(!(stmts[1] as AST.STMT.DeclarationVariable).assigned);
				return assertEqualTypes(
					stmts.slice(2).map((stmt) => (stmt as AST.STMT.StatementExpression).expr!.type()),
					[
						TYPE.INT,
						new TYPE.Maybe(TYPE.INT),
					],
				);
			});
		});


		test.suite('Claim', () => {
			test.test('returns the type value of the claimed type.', () => {
				assert.ok(AST.EXPR.Claim.fromSource('3 as <int | null>').type().equals(TYPE.INT.union(TYPE.NULL)));
			});
			test.test('allows claiming to a type alias.', () => {
				const claim: AST.EXPR.Claim = AST.EXPR.Claim.fromSource('"Alice" as <Name>');
				const id: bigint = Validator.cookTokenIdentifier('Name');
				claim.validator.addSymbol(new SymbolSchemaType(id, claim.claimed_type));
				(claim.validator.getSymbol(id) as SymbolSchemaType).typevalue = TYPE.STR;
				return assert.strictEqual(claim.type(), TYPE.STR);
			});
			test.test('allows claiming to `nothing` even though types are disjoint.', () => {
				assert.ok(AST.EXPR.Claim.fromSource('42 as <nothing>').type().isBottomType);
			});
			test.test('allows claiming a `nothing` expression even though types are disjoint.', () => {
				const claim: AST.EXPR.Claim = AST.EXPR.Claim.fromSource('n as <int>');
				const id: bigint = Validator.cookTokenIdentifier('n');
				claim.validator.addSymbol(new SymbolSchemaVar(id, claim.operand, false, false));
				(claim.validator.getSymbol(id) as SymbolSchemaVar).type = TYPE.NOTHING;
				return assert.strictEqual(claim.type(), TYPE.INT);
			});
			test.test('throws when the operand type and claimed type are disjoint (and neither is `nothing`).', () => {
				xjs.Array.forEachAggregated(extract_lines`
					3       as <str>
					"three" as <int>
					3       as <float>
					3.0     as <int>
				`, (src) => assert.throws(() => AST.EXPR.Claim.fromSource(src).type(), TypeErrorNotAssignable));
			});
			test.test('allows disjoint types when claiming to top type first.', () => {
				setupScript(`{
					3       as <anything> as <str>;
					"three" as <anything> as <int>;
					3       as <anything> as <float>;
					3.0     as <anything> as <int>;
				}`, {build: false}); // assert does not throw
			});
			test.test('allows disjoint types when forcing.', () => {
				setupScript(`{
					3       as! <str>;
					"three" as! <int>;
					3       as! <float>;
					3.0     as! <int>;
				}`, {build: false}); // assert does not throw
			});
		});


		test.suite('Switch', () => {
			test.test('returns `nothing` if the compared value is type `nothing`.', () => {
				assert_shallowStrictEqual(
					setupScript(`{
						switch 42 default true;
						switch 42 as <nothing> default 43;
					}`, {build: false}).stmts.map((stmt) => (stmt as AST.STMT.StatementExpression).expr!.type()),
					[
						TYPE.TRUE,
						TYPE.NOTHING,
					],
				);
			});
			test.test('returns the union of all cases’ consequents and the default.', () => {
				assertEqualTypes(
					setupScript(`{
						switch 42 default 4.3;
						switch 42
							case 1.1 -> 10
							case 2.2 -> 20
							default 43;
					}`, {build: false}).stmts.map((stmt) => (stmt as AST.STMT.StatementExpression).expr!.type()),
					[
						typeUnit(4.3),
						TYPE.Union.all(typeUnit(10n), typeUnit(20n), typeUnit(43n)),
					],
				);
			});
			test.test('throws when at least one antecedent is an error.', () => {
				const {stmts} = setupScript(`{
					switch 42
						case 1.1       | 2.2 -> 15
						case 33 / 10.0 | 4.4 -> 25
						default 43;
				}`, {typeCheck: false});
				assert.throws(() => (stmts[0] as AST.STMT.StatementExpression).expr!.typeCheck(), TypeErrorInvalidOperation);
			});
		});


		test.suite('ExpressionFunction', () => {
			test.test('returns a function type.', () => {
				const {stmts} = setupScript(`{
					\\(a: int, mut b: float | null, mut $c: bool, delta= d: nat): void { return; };
					% TODO: test optional parameters (steal from 'test/validator/Type.test.ts')
					\\(): int | float => 4.2;
				}`, {build: false});
				return assertEqualTypes(stmts.map((stmt) => (stmt as AST.STMT.StatementExpression).expr!.type()), [
					new TYPE.Function(TYPE.Tuple.fromTypes([
						TYPE.INT,
						TYPE.FLOAT.union(TYPE.NULL),
					]), TYPE.Record.fromTypes(new Map<bigint, TYPE.Type>([
						[Validator.cookTokenIdentifier('c'),     TYPE.BOOL],
						[Validator.cookTokenIdentifier('delta'), TYPE.NAT],
					]))),
					new TYPE.Function(undefined, undefined, TYPE.INT.union(TYPE.FLOAT)),
				]);
			});
		});
	});



	test.suite('Constant', () => {
		test.suite('#varCheck', () => {
			test.test('never throws.', () => {
				AST.EXPR.Constant.fromSource('42').varCheck();
			});
		});


		test.suite('#type', () => {
			test.test('returns the result of `this#interpreterValue`, wrapped in a `new Unit`.', () => {
				const constants: AST.EXPR.Constant[] = extract_tokens(`
					null  false  true
					@then  @str  @false  @foobar
					55  -55  +033  -033  0  -0
					2.007  -2.007
					91.27e4  -91.27e4  91.27e-4  -91.27e-4
					-0.0  6.8e+0  6.8e-0  0.0e+0  -0.0e-0
					"42😀"  "42\\u{1f600}"
				`).map((src) => AST.EXPR.Constant.fromSource(src));
				return assertEqualTypes(
					constants.map((c) => c.type()),
					constants.map((c) => new TYPE.Unit(c.interpreterValue)),
				);
			});
		});


		/* eslint-disable @stylistic/array-element-newline */
		test.suite('#interpreterValue', () => {
			test.test('computes null, boolean, and symbol values.', () => {
				assert.deepStrictEqual(extract_tokens(`
					null  false  true
					@then  @str  @false  @foobar
				`).map((src) => AST.EXPR.Constant.fromSource(src).interpreterValue), [
					VALUE.NULL,
					VALUE.FALSE,
					VALUE.TRUE,
					new VALUE.Symbol(0x52n, 'then'),
					new VALUE.Symbol(0x46n, 'str'),
					new VALUE.Symbol(0x49n, 'false'),
					new VALUE.Symbol(Validator.cookTokenIdentifier('foobar'), 'foobar'),
				]);
			});
			test.test('computes int values.', () => {
				assert.deepStrictEqual(extract_tokens(`
					55  -55  033  -033  0  -0
					\\o55  -\\o55  \\q033  -\\q033
				`).map((src) => AST.EXPR.Constant.fromSource(src).interpreterValue), [
					55, -55, 33, -33, 0, 0,
					parseInt('55', 8), parseInt('-55', 8), parseInt('33', 4), parseInt('-33', 4),
				].map((v) => new VALUE.Integer(BigInt(v))));
			});
			test.test('computes nat values.', () => {
				assert.deepStrictEqual(extract_tokens(`
					+55  +033  +0
					+\\o55  +\\q033
				`).map((src) => AST.EXPR.Constant.fromSource(src).interpreterValue), [
					55, 33, 0,
					parseInt('55', 8), parseInt('33', 4),
				].map((v) => new VALUE.Natural(BigInt(v))));
			});
			test.test('computes float values.', () => {
				assert.deepStrictEqual(extract_tokens(`
					2.007  -2.007
					91.27e4  -91.27e4  91.27e-4  -91.27e-4
					-0.0  6.8e+0  6.8e-0  0.0e+0  -0.0e-0
				`).map((src) => AST.EXPR.Constant.fromSource(src).interpreterValue), [
					2.007, -2.007,
					91.27e4, -91.27e4, 91.27e-4, -91.27e-4,
					-0, 6.8, 6.8, 0, -0,
				].map((v) => new VALUE.Float(v)));
			});
			test.test('computes string values.', () => {
				assert.deepStrictEqual(
					AST.EXPR.Constant.fromSource('"42😀\\u{1f600}"').interpreterValue,
					new VALUE.String('42😀\u{1f600}'),
				);
			});
		});
		/* eslint-enable @stylistic/array-element-newline */
	});



	test.suite('Variable', () => {
		test.suite('#varCheck', () => {
			test.test('throws if the validator does not contain a record for the identifier.', () => {
				setupScript(`{
					val mut i: int = 42;
					i;
				}`, {typeCheck: false}); // assert does not throw
				assert.throws(() => AST.EXPR.Variable.fromSource('i').varCheck(), ReferenceErrorUndeclared);
			});
			test.test('throws when declared in an inner scope.', () => {
				assert.throws(() => setupScript(`{
					if true then {
						val mut i: int = 42;
					};
					i;
				}`, {typeCheck: false}), ReferenceErrorUndeclared);
			});
			test.test('throws when there is a temporal dead zone.', {expectFailure: true}, () => {
				assert.throws(() => setupScript(`{
					i;
					val mut i: int = 42;
				}`, {typeCheck: false}), ReferenceErrorDeadZone);
			});
			test.test('throws if it was declared as a type alias.', () => {
				assert.throws(() => setupScript(`{
					type FOO = int;
					42 || FOO;
				}`, {typeCheck: false}), ReferenceErrorKind);
			});
			test.test('iteration variable of `for` loop is scoped only to the block.', () => {
				setupScript(`{
					for it: float in [1.1, 2.2, 3.3] do {
						it;
					};
				}`, {typeCheck: false}); // assert does not throw
				assert.throws(() => setupScript(`{
					for it: float in [1.1, 2.2, 3.3, it] do {
						42;
					};
				}`, {typeCheck: false}), ReferenceErrorUndeclared, 'iteraion variable cannot be referenced in the iterator expression.');
				assert.throws(() => setupScript(`{
					for it: float in [1.1, 2.2, 3.3] do {
						42;
					};
					it;
				}`, {typeCheck: false}), ReferenceErrorUndeclared, 'iteration variable cannot be referenced after the iteration statement.');
			});
		});
	});



	test.suite('Template', () => {
		function initTemplates(): AST.EXPR.Template[] {
			return [
				AST.EXPR.Template.fromSource('"""42😀"""'),
				AST.EXPR.Template.fromSource('"""the answer is {{7 * 3 * 2}} but what is the question?"""'),
				(setupScript(`{
					val mut x: int = 21;
					"""the answer is {{x * 2}} but what is the question?""";
				}`, {build: false}).stmts[1] as AST.STMT.StatementExpression).expr as AST.EXPR.Template,
			];
		}
		test.suite('#type', () => {
			test.test('always returns `String`.', () => {
				const templates: readonly AST.EXPR.Template[] = initTemplates();
				assertEqualTypes(
					templates.map((t) => t.type()),
					repeat(TYPE.STR, templates.length),
				);
			});
		});
	});



	test.suite('CollectionLiteral', () => {
		test.suite('#varCheck', () => {
			test.suite('{Type}Record,Dict', () => {
				test.test('var-checks all keys before all values.', () => {
					const {goal, stmts} = setupScript(`{
						type T = str;
						type U = (a: bool, b: (z: int), c: T, d: (y: float));
						val f: null = null;
						(e= [x= 42, w= 4.2], f= f);
						[g= (w= 42, x= 4.2), f= f];
					}`, {build: false});
					assert.partialDeepStrictEqual(
						goal.block!.validator.getAllSymbols(),
						new Map([
							[Validator.cookTokenIdentifier('T'), {source: 'T'}],
							[Validator.cookTokenIdentifier('U'), {source: 'U'}],
							[Validator.cookTokenIdentifier('f'), {source: 'f'}],
						]),
					);
					return assertEqualTypes(
						(stmts[1] as AST.STMT.DeclarationType).assigned.eval(),
						TYPE.Record.fromTypes(new Map([
							[Validator.cookTokenIdentifier('a'), TYPE.BOOL],
							[Validator.cookTokenIdentifier('b'), TYPE.Record.fromTypes(new Map([[Validator.cookTokenIdentifier('z'), TYPE.INT]]))],
							[Validator.cookTokenIdentifier('c'), TYPE.STR],
							[Validator.cookTokenIdentifier('d'), TYPE.Record.fromTypes(new Map([[Validator.cookTokenIdentifier('y'), TYPE.FLOAT]]))],
						])),
					);
				});
				test.test('throws if containing duplicate keys.', () => {
					[
						AST.TYPE.Record .fromSource('(a: int, b: float, c: str)'),
						AST.EXPR.Record .fromSource('(a= 1, b= 2.0, c= "three")'),
						AST.EXPR.Dict   .fromSource('[a= 1, b= 2.0, c= "three"]'),
					].forEach((node) => node.varCheck()); // assert does not throw

					[
						AST.TYPE.Record .fromSource('(a: int, b: float, a: str)'),
						AST.TYPE.Record .fromSource('(_: int, b: float, _: str)'),
						AST.EXPR.Record .fromSource('(a= 1, b= 2.0, a= "three")'),
						AST.EXPR.Record .fromSource('(_= 1, b= 2.0, _= "three")'),
						AST.EXPR.Dict   .fromSource('[a= 1, b= 2.0, a= "three"]'),
						AST.EXPR.Dict   .fromSource('[_= 1, b= 2.0, _= "three"]'),
					].forEach((node) => assert.throws(() => node.varCheck(), AssignmentErrorDuplicateKey));

					new Map<AST.AstNode, string[]>([
						[AST.TYPE.Record .fromSource('(c: int, d: float, c: str, d: bool)'),  ['c', 'd']],
						[AST.TYPE.Record .fromSource('(e: int, f: float, e: str, e: bool)'),  ['e', 'e']],
						[AST.EXPR.Record .fromSource('(c= 1, d= 2.0, c= "three", d= false)'), ['c', 'd']],
						[AST.EXPR.Record .fromSource('(e= 1, f= 2.0, e= "three", e= false)'), ['e', 'e']],
						[AST.EXPR.Dict   .fromSource('[c= 1, d= 2.0, c= "three", d= false]'), ['c', 'd']],
						[AST.EXPR.Dict   .fromSource('[e= 1, f= 2.0, e= "three", e= false]'), ['e', 'e']],
					]).forEach((dupes, node) => assert.throws(() => node.varCheck(), (err) => {
						assertAssignable(err as Error, {
							cons:   AggregateError,
							errors: dupes.map((k) => ({
								cons:    AssignmentErrorDuplicateKey,
								message: `Duplicate record/dict/parameter key \`${k}\`.`,
							})),
						});
						return true;
					}));
				});
			});
		});


		test.suite('#type', () => {
			test.test('with constant folding on.', () => {
				const expected: readonly TYPE.Unit[] = [typeUnit(1n), typeUnit(2.0), typeUnit('three')];
				const collections: readonly [
					AST.EXPR.Tuple,
					AST.EXPR.Record,
					AST.EXPR.Set,
					AST.EXPR.Map,
				] = [
					AST.EXPR.Tuple  .fromSource('(   1,    2.0,    "three")'),
					AST.EXPR.Record .fromSource('(a= 1, b= 2.0, _= "three")'),
					AST.EXPR.Set    .fromSource('{   1,    2.0,    "three"}'),
					AST.EXPR.Map    .fromSource(`
						{
							"a" || "" -> 1,
							21 + 21   -> 2.0,
							3.0 * 1.0 -> "three",
						}
					`),
				];
				return assertEqualTypes(
					collections.map((node) => node.type()),
					[
						TYPE.Tuple.fromTypes(expected),
						TYPE.Record.fromTypes(new Map(collections[1].children.map((c, i) => [
							c.key.id,
							expected[i],
						]))),
						new TYPE.Set(TYPE.Union.all(...expected), true),
						new TYPE.Map(
							TYPE.Union.all(typeUnit('a'), TYPE.INT, TYPE.FLOAT),
							TYPE.Union.all(...expected),
							true,
						),
					],
				);
			});
			test.test('does not throw if value type contains reference type.', () => {
				setupScript(`{
					(   1,    [2.2],    "three");
					(a= 1, b= [2.2], c= "three");
				}`, {build: false}); // assert does not throw
			});
		});
	});



	test.suite('ExpressionBlock', () => {
		test.suite('#type', () => {
			test.test('throws when the last statement is not an expression-statement.', () => {
				const {goal} = setupScript(`{
					val mut x: int = 42;
					val mut y: int | null = {
						x;
						val mut z: int = 69;
						%> Error!
					};
					x;
					y;
				}`, {typeCheck: false});
				assert.throws(() => goal.typeCheck(), /The last statement of a block-expression must be an expression-statement/);
			});
			test.test('throws when the determinant is empty.', () => {
				const {goal} = setupScript(`{
					val mut x: int = 42;
					val mut y: int | null = {
						x;
						val mut z: int = 69;
						; %> Error!
					};
					x;
					y;
				}`, {typeCheck: false});
				assert.throws(() => goal.typeCheck(), /The determining expression-statement of a block-expression must be nonempty/);
			});
			test.test('returns the type of the determinant.', () => {
				const {stmts} = setupScript(`{
					val mut x: int = 42;
					val mut y: int | null = {
						x;
						val mut z: int = 69;
						z; % type \`int\`
					};
					x;
					y;
				}`, {build: false});
				assertEqualTypes((stmts[1] as AST.STMT.DeclarationVariable).assigned!.type(), TYPE.INT);
			});
		});
	});
});
