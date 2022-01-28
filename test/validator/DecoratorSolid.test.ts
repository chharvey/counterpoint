import * as assert from 'assert'
import Parser, {
	Query,
	QueryCapture,
	SyntaxNode,
} from 'tree-sitter';
import Counterpoint from 'tree-sitter-counterpoint';
import type {NonemptyArray} from '../../src/lib/index.js';
import {
	SolidConfig,
	CONFIG_DEFAULT,
	Dev,
} from '../../src/core/index.js';
import {
	PARSENODE_SOLID as PARSENODE,
} from '../../src/parser/index.js';
import {
	Operator,
	ValidAccessOperator,
	ASTNODE_SOLID as AST,
	DECORATOR_SOLID,
} from '../../src/validator/index.js';
import {
	assert_arrayLength,
} from '../assert-helpers.js';
import * as h from '../helpers-parse.js';



describe('DecoratorSolid', () => {
	describe('#decorate', () => {
		describe('Word ::= KEYWORD | IDENTIFIER', () => {
			it('makes an ASTNodeKey.', () => {
				/*
					<Key source="let"/>
					<Key source="foobar"/>
				*/
				const srcs: string[] = [
					`let`,
					`foobar`,
				];
				assert.deepStrictEqual(
					srcs,
					srcs.map((src) => DECORATOR_SOLID.decorate(h.wordFromString(src)).source),
				);
			});
		});

		describe('PrimitiveLiteral ::= "null" | "false" | "true" | INTEGER | FLOAT | STRING', () => {
			it('makes an ASTNodeConstant.', () => {
				/*
					<Constant source="null"/>
				*/
				assert.deepStrictEqual([
					`null;`,
					`false;`,
					`true;`,
					`42;`,
					`4.2;`,
					`'hello';`,
				].map((src) => (DECORATOR_SOLID.decorate(h.primitiveLiteralFromSource(src)) as unknown as AST.ASTNodeConstant).source), [
					`null`,
					`false`,
					`true`,
					`42`,
					`4.2`,
					`'hello'`,
				])
			})
		})

		describe('EntryType<Named, Optional> ::= <Named+>(Word . <Optional->":") <Optional+>"?:" Type', () => {
			specify('EntryType ::= Type', () => {
				/*
					<ItemType optional=false>
						<TypeConstant source="float"/>
					</ItemType>
				*/
				const itemtype: AST.ASTNodeItemType = DECORATOR_SOLID.decorate(h.entryTypeFromString(`float`));
				assert.ok(!itemtype.optional);
				assert.deepStrictEqual(
					itemtype.val.source,
					`float`,
				);
			});
			specify('EntryType_Optional ::= "?:" Type', () => {
				/*
					<ItemType optional=true>
						<TypeConstant source="float"/>
					</ItemType>
				*/
				const itemtype: AST.ASTNodeItemType = DECORATOR_SOLID.decorate(h.entryTypeFromString(`?:float`));
				assert.ok(itemtype.optional);
				assert.deepStrictEqual(
					itemtype.val.source,
					`float`,
				);
			});
			specify('EntryType_Named ::= Word ":" Type', () => {
				/*
					<PropertyType optional=false>
						<Key source="fontSize"/>
						<TypeConstant source="float"/>
					</PropertyType>
				*/
				const propertytype: AST.ASTNodePropertyType = DECORATOR_SOLID.decorate(h.entryTypeNamedFromString(`fontSize: float`));
				assert.ok(!propertytype.optional);
				assert.deepStrictEqual(
					[propertytype.key.source, propertytype.val.source],
					[`fontSize`,              `float`],
				);
			});
			specify('EntryType_Named_Optional ::= Word "?:" Type', () => {
				/*
					<PropertyType optional=true>
						<Key source="fontSize"/>
						<TypeConstant source="float"/>
					</PropertyType>
				*/
				const propertytype: AST.ASTNodePropertyType = DECORATOR_SOLID.decorate(h.entryTypeNamedFromString(`fontSize?: float`));
				assert.ok(propertytype.optional);
				assert.deepStrictEqual(
					[propertytype.key.source, propertytype.val.source],
					[`fontSize`,              `float`],
				);
			});
		});

		describe('TypeTupleLiteral ::= "[" (","? ItemsType)? "]"', () => {
			it('makes an empty ASTNodeTypeTuple.', () => {
				/*
					<TypeTuple/>
				*/
				assert_arrayLength(DECORATOR_SOLID.decorate(h.tupleTypeFromString(`[]`)).children, 0);
			});
			it('makes a nonempty ASTNodeTypeTuple.', () => {
				/*
					<TypeTuple>
						<TypeAlias source="T"/>
						<TypeConstant source="42"/>
						<TypeOperation source="null | bool">...</TypeOperation>
						<TypeOperation source="?:str">...</TypeOperation>
					</TypeTuple>
				*/
				assert.deepStrictEqual(DECORATOR_SOLID.decorate(h.tupleTypeFromString(`
					[
						T,
						42,
						null | bool,
						?:str,
					]
				`)).children.map((c) => c.source), [
					`T`,
					`42`,
					`null | bool`,
					`?: str`,
				]);
			});
		});

		describe('TypeRecordLiteral ::= "[" ","? PropertiesType "]"', () => {
			it('makes an ASTNodeTypeRecord.', () => {
				/*
					<TypeRecord>
						<PropertyType source="let: bool">...</PropertyType>
						<PropertyType source="foobar: int">...</PropertyType>
						<PropertyType source="diz?: str">...</PropertyType>
						<PropertyType source="qux: null">...</PropertyType>
					</TypeRecord>
				*/
				assert.deepStrictEqual(DECORATOR_SOLID.decorate(h.recordTypeFromString(`
					[
						let: bool,
						foobar: int,
						diz?: str,
						qux: null,
					]
				`)).children.map((c) => c.source), [
					`let : bool`,
					`foobar : int`,
					`diz ?: str`,
					`qux : null`,
				]);
			});
		});

		describe('TypeHashLiteral ::= "[" ":" Type "]"', () => {
			it('makes an ASTNodeTypeHash.', () => {
				/*
					<TypeHash>
						<TypeConstant source="bool"/>
					</TypeHash>
				*/
				const hash: AST.ASTNodeType = DECORATOR_SOLID.decorate(h.unitTypeFromString(`[:bool]`));
				assert.ok(hash instanceof AST.ASTNodeTypeHash);
				assert.deepStrictEqual(hash.type.source, `bool`);
			});
		});

		describe('TypeMapLiteral ::= "{" Type "->" Type "}"', () => {
			it('makes an ASTNodeTypeMap.', () => {
				/*
					<TypeMap>
						<TypeConstant source="int"/>
						<TypeConstant source="float"/>
					</TypeMap>
				*/
				const map: AST.ASTNodeType = DECORATOR_SOLID.decorate(h.unitTypeFromString(`{int -> float}`));
				assert.ok(map instanceof AST.ASTNodeTypeMap);
				assert.deepStrictEqual(map.antecedenttype.source, `int`);
				assert.deepStrictEqual(map.consequenttype.source, `float`);
			});
		});

		describe('GenericArguments ::= "<" ","? Type# ","? ">"', () => {
			it('makes a Sequence<SemanticType>.', () => {
				/*
					<TypeOperation source="Bar | Qux">...</TypeOperation>
					<TypeAlias source="Diz"/>
				*/
				const args: PARSENODE.ParseNodeTypeCompound = h.compoundTypeFromString(`Foo.<Bar | Qux, Diz>`);
				assert_arrayLength(args.children, 2);
				assert.ok(args.children[1] instanceof PARSENODE.ParseNodeGenericCall);
				const sequence: NonemptyArray<AST.ASTNodeType> = DECORATOR_SOLID.decorate(args.children[1]);
				assert.deepStrictEqual(
					sequence.map((c) => c.source),
					[`Bar | Qux`, `Diz`],
				);
			});
		});

		describe('TypeUnit ::= IDENTIFIER', () => {
			it('makes an ASTNodeTypeAlias.', () => {
				/*
					<TypeAlias source="Foo"/>
				*/
				return [
					`Foo`,
					`Bar`,
					`Qux`,
				].forEach((src) => assert.ok(DECORATOR_SOLID.decorate(h.unitTypeFromString(src)) instanceof AST.ASTNodeTypeAlias));
			});
		});

		describe('TypeUnit ::= PrimitiveLiteral', () => {
			it('makes an ASTNodeTypeConstant.', () => {
				/*
					<TypeConstant source="null"/>
				*/
				assert.deepStrictEqual([
					`null`,
					`false`,
					`true`,
					`42`,
					`4.2`,
				].map((src) => {
					const constant: AST.ASTNodeType = DECORATOR_SOLID.decorate(h.unitTypeFromString(src));
					assert.ok(constant instanceof AST.ASTNodeTypeConstant);
					return constant.source;
				}), [
					`null`,
					`false`,
					`true`,
					`42`,
					`4.2`,
				])
			})
		})

		describe('TypeCompound ::= TypeCompound (PropertyAccessType | GenericCall)', () => {
			it('access by integer.', () => {
				/*
					<AccessType>
						<TypeTuple source="[42, 420, 4200]">...</TypeTuple>
						<IndexType>
							<TypeConstant source="1"/>
						</IndexType>
					</AccessType>
				*/
				const access: AST.ASTNodeType = DECORATOR_SOLID.decorate(h.compoundTypeFromString(`[42, 420, 4200].1`));
				assert.ok(access instanceof AST.ASTNodeTypeAccess, 'should be instance of ASTNodeTypeAccess.');
				assert.ok(access.accessor instanceof AST.ASTNodeIndexType);
				assert.deepStrictEqual(
					[access.base.source,    access.accessor.source],
					[`[ 42 , 420 , 4200 ]`, `. 1`],
				);
			});
			it('access by key.', () => {
				/*
					<AccessType>
						<TypeRecord source="[c: 42, b: 420, a: 4200]">...</TypeRecord>
						<Key source="b"/>
					</AccessType>
				*/
				const access: AST.ASTNodeType = DECORATOR_SOLID.decorate(h.compoundTypeFromString(`[c: 42, b: 420, a: 4200].b`));
				assert.ok(access instanceof AST.ASTNodeTypeAccess, 'should be instance of ASTNodeTypeAccess.');
				assert.ok(access.accessor instanceof AST.ASTNodeKey);
				assert.deepStrictEqual(
					[access.base.source,                access.accessor.source],
					[`[ c : 42 , b : 420 , a : 4200 ]`, `b`],
				);
			});
			it('makes an ASTNodeTypeCall.', () => {
				/*
					<TypeCall>
						<TypeAlias source="Foo"/>
						<TypeOperation source="Bar | Qux">...</TypeOperation>
						<TypeAlias source="Diz"/>
					</TypeCall>
				*/
				const call: AST.ASTNodeType = DECORATOR_SOLID.decorate(h.compoundTypeFromString(`Foo.<Bar | Qux, Diz>`));
				assert.ok(call instanceof AST.ASTNodeTypeCall, 'should be instance of ASTNodeTypeCall.');
				assert.deepStrictEqual(
					[call.base, ...call.args].map((c) => c.source),
					[`Foo`, `Bar | Qux`, `Diz`],
				);
			});
		});

		describe('TypeUnarySymbol ::= TypeUnarySymbol ("?" | "!")', () => {
			it('makes an ASTNodeTypeOperationUnary.', () => {
				/*
					<TypeOperation operator="?">
						<TypeConstant source="int"/>
					</TypeOperation>
				*/
				const operation: AST.ASTNodeType = DECORATOR_SOLID.decorate(h.unarySymbolTypeFromString(`int?`));
				assert.ok(operation instanceof AST.ASTNodeTypeOperationUnary);
				assert.deepStrictEqual(
					[operation.operand.source, operation.operator],
					[`int`,                    Operator.ORNULL],
				)
			})
			it('operator `!` is not yet supported.', () => {
				assert.throws(() => DECORATOR_SOLID.decorate(h.unarySymbolTypeFromString(`float!`)), /not yet supported/);
			});
		})

		describe('TypeUnarySymbol ::= TypeUnarySymbol "[" INTEGER? "]"', () => {
			it('makes an ASTNodeTypeList with null count.', () => {
				/*
					<ASTNodeTypeList count=null>
						<TypeConstant source="int"/>
					</ASTNodeTypeList>
				*/
				const list: AST.ASTNodeType = DECORATOR_SOLID.decorate(h.unarySymbolTypeFromString(`int[]`));
				assert.ok(list instanceof AST.ASTNodeTypeList);
				assert.deepStrictEqual(
					[list.type.source, list.count],
					[`int`,            null],
				);
			});
			it('makes an ASTNodeTypeList with non-null count.', () => {
				/*
					<ASTNodeTypeList count=3n>
						<TypeConstant source="float"/>
					</ASTNodeTypeList>
				*/
				const list: AST.ASTNodeType = DECORATOR_SOLID.decorate(h.unarySymbolTypeFromString(`float[3]`));
				assert.ok(list instanceof AST.ASTNodeTypeList);
				assert.deepStrictEqual(
					[list.type.source, list.count],
					[`float`,          3n],
				);
			});
		});

		describe('TypeUnarySymbol ::= TypeUnarySymbol "{" "}"', () => {
			it('makes an ASTNodeTypeSet.', () => {
				/*
					<ASTNodeTypeSet>
						<TypeConstant source="bool"/>
					</ASTNodeTypeSet>
				*/
				const set: AST.ASTNodeType = DECORATOR_SOLID.decorate(h.unarySymbolTypeFromString(`bool{}`));
				assert.ok(set instanceof AST.ASTNodeTypeSet);
				assert.deepStrictEqual(set.type.source, `bool`);
			});
		});

		describe('TypeUnaryKeyword ::= "mutable" TypeUnaryKeyword', () => {
			it('makes an ASTNodeTypeOperationUnary.', () => {
				/*
					<TypeOperation operator="mutable">
						<TypeConstant source="int"/>
					</TypeOperation>
				*/
				const operation: AST.ASTNodeType = DECORATOR_SOLID.decorate(h.unaryKeywordTypeFromString(`mutable int`));
				assert.ok(operation instanceof AST.ASTNodeTypeOperationUnary);
				assert.deepStrictEqual(
					[operation.operand.source, operation.operator],
					[`int`,                    Operator.MUTABLE],
				);
			});
		});

		describe('TypeIntersection ::= TypeIntersection "&" TypeUnaryKeyword', () => {
			it('makes an ASTNodeTypeOperationBinary.', () => {
				/*
					<TypeOperation operator="&">
						<TypeConstant source="int"/>
						<TypeConstant source="3"/>
					</TypeOperation>
				*/
				const operation: AST.ASTNodeType = DECORATOR_SOLID.decorate(h.intersectionTypeFromString(`int & 3`));
				assert.ok(operation instanceof AST.ASTNodeTypeOperationBinary);
				assert.deepStrictEqual(
					[operation.operand0.source, operation.operator, operation.operand1.source],
					[`int`,                     Operator.AND,       `3`],
				)
			})
		})

		describe('TypeUnion ::= TypeUnion "|" TypeIntersection', () => {
			it('makes an ASTNodeTypeOperationBinary.', () => {
				/*
					<TypeOperation operator="|">
						<TypeOperation source="4.2 ?">...</TypeOperation>
						<TypeOperation source="int & int">...</TypeOperation>
					</TypeOperation>
				*/
				const operation: AST.ASTNodeType = DECORATOR_SOLID.decorate(h.unionTypeFromString(`4.2? | int & int`));
				assert.ok(operation instanceof AST.ASTNodeTypeOperationBinary);
				assert.deepStrictEqual(
					[operation.operand0.source, operation.operator, operation.operand1.source],
					[`4.2 ?`,                   Operator.OR,        `int & int`],
				)
			})
		})

		describe('Type ::= TypeUnion', () => {
			it('makes an ASTNodeTypeOperation.', () => {
				/*
					<TypeOperation operator="&">
						<TypeOperation source="4.2 ?">...</TypeOperation>
						<TypeOperation source="int | int">...</TypeOperation>
					</TypeOperation>
				*/
				const operation: AST.ASTNodeType = DECORATOR_SOLID.decorate(h.unionTypeFromString(`4.2? & (int | int)`));
				assert.ok(operation instanceof AST.ASTNodeTypeOperationBinary);
				assert.deepStrictEqual(
					[operation.operand0.source, operation.operator, operation.operand1.source],
					[`4.2 ?`,                   Operator.AND,       `int | int`],
				)
			})
		})

		Dev.supports('stringTemplate-decorate') && describe('StringTemplate', () => {
			function templateSources(tpl: PARSENODE.ParseNodeStringTemplate, ...srcs: Readonly<NonemptyArray<string>>): void {
				return assert.deepStrictEqual([...DECORATOR_SOLID.decorate(tpl).children].map((c) => c.source), srcs);
			}
			specify('StringTemplate ::= TEMPLATE_FULL', () => {
				templateSources(h.stringTemplateFromSource(`
					'''full1''';
				`), `'''full1'''`);
			});
			specify('StringTemplate ::= TEMPLATE_HEAD TEMPLATE_TAIL', () => {
				templateSources(h.stringTemplateFromSource(`
					'''head1{{}}tail1''';
				`), `'''head1{{`, `}}tail1'''`);
			});
			specify('StringTemplate ::= TEMPLATE_HEAD Expression TEMPLATE_TAIL', () => {
				templateSources(h.stringTemplateFromSource(`
					'''head1{{ '''full1''' }}tail1''';
				`), `'''head1{{`, `'''full1'''`, `}}tail1'''`);
			});
			specify('StringTemplate ::= TEMPLATE_HEAD StringTemplate__0__List TEMPLATE_TAIL', () => {
				templateSources(h.stringTemplateFromSource(`
					'''head1{{}}midd1{{}}tail1''';
				`), `'''head1{{`, `}}midd1{{`, `}}tail1'''`);
			});
			specify('StringTemplate ::= TEMPLATE_HEAD Expression StringTemplate__0__List TEMPLATE_TAIL', () => {
				templateSources(h.stringTemplateFromSource(`
					'''head1{{ '''full1''' }}midd1{{}}tail1''';
				`), `'''head1{{`, `'''full1'''`, `}}midd1{{`, `}}tail1'''`);
			});

			specify('StringTemplate__0__List ::= TEMPLATE_MIDDLE Expression', () => {
				templateSources(h.stringTemplateFromSource(`
					'''head1{{ '''full1''' }}midd1{{ '''full2''' }}tail1''';
				`), `'''head1{{`, `'''full1'''`, `}}midd1{{`, `'''full2'''`, `}}tail1'''`);
			});
			specify('StringTemplate__0__List ::= StringTemplate__0__List TEMPLATE_MIDDLE', () => {
				templateSources(h.stringTemplateFromSource(`
					'''head1{{ '''full1''' }}midd1{{ '''full2''' }}midd2{{}}tail1''';
				`), `'''head1{{`, `'''full1'''`, `}}midd1{{`, `'''full2'''`, `}}midd2{{`, `}}tail1'''`);
			});
			specify('StringTemplate__0__List ::= StringTemplate__0__List TEMPLATE_MIDDLE Expression', () => {
				templateSources(h.stringTemplateFromSource(`
					'''head1{{ '''full1''' }}midd1{{ '''full2''' }}midd2{{ '''head2{{ '''full3''' }}tail2''' }}tail1''';
				`), `'''head1{{`, `'''full1'''`, `}}midd1{{`, `'''full2'''`, `}}midd2{{`, `'''head2{{ '''full3''' }}tail2'''`, `}}tail1'''`);
			});
		});

		describe('Property ::= Word "=" Expression', () => {
			it('makes an ASTNodeProperty.', () => {
				/*
					<Property>
						<Key source="fontSize"/>
						<Operation source="1.0 + 0.25">...</Operation>
					</Property>
				*/
				const property = DECORATOR_SOLID.decorate(h.propertyFromString(`fontSize= 1.0 + 0.25`));
				assert.ok(property instanceof AST.ASTNodeProperty); // FIXME: `AST.ASTNodeProperty` is assignable to `TemplatePartialType`, so `Decorator.decorate` overlads get confused
				assert.deepStrictEqual(
					[property.key.source, property.val.source],
					[`fontSize`,          `1.0 + 0.25`],
				);
			});
		});

		describe('Case ::= Expression "->" Expression', () => {
			it('makes an ASTNodeCase', () => {
				/*
					<Case>
						<Operation source="1 + 0.25">...</Operation>
						<Constant source="1.25"/>
					</Case>
				*/
				const kase: AST.ASTNodeCase = DECORATOR_SOLID.decorate(h.caseFromString(`1 + 0.25 -> 1.25`));
				assert.deepStrictEqual(
					[kase.antecedent.source, kase.consequent.source],
					[`1 + 0.25`,             `1.25`],
				);
			});
		});

		context('ExpressionGrouped ::= "(" Expression ")"', () => {
			it('returns the inner Expression node.', () => {
				/*
					<Operation operator=ADD>
						<Constant source="2"/>
						<Constant source="-3"/>
					</Operation>
				*/
				const operation: AST.ASTNodeExpression = DECORATOR_SOLID.decorate(h.groupedExpressionFromSource(`(2 + -3);`));
				assert.ok(operation instanceof AST.ASTNodeOperationBinary);
				assert.ok(operation.operand0 instanceof AST.ASTNodeConstant);
				assert.ok(operation.operand1 instanceof AST.ASTNodeConstant);
				assert.deepStrictEqual(
					[operation.operand0.source, operation.operator, operation.operand1.source],
					[`2`,                       Operator.ADD,       `-3`],
				)
			})
			it('recursively applies to several sub-expressions.', () => {
				/*
					<Operation operator=EXP>
						<Operation operator=NEG>
							<Constant source="42"/>
						</Operation>
						<Operation operator=MUL>
							<Constant source="2"/>
							<Constant source="420"/>
						</Operation>
					</Operation>
				*/
				const operation: AST.ASTNodeExpression = DECORATOR_SOLID.decorate(h.expressionFromSource(`(-(42) ^ +(2 * 420));`));
				assert.ok(operation instanceof AST.ASTNodeOperationBinary);
				assert.strictEqual(operation.operator, Operator.EXP)
				assert.ok(operation.operand0 instanceof AST.ASTNodeOperationUnary);
				assert.strictEqual(operation.operand0.operator, Operator.NEG);
				assert.ok(operation.operand0.operand instanceof AST.ASTNodeConstant);
				assert.strictEqual(operation.operand0.operand.source, `42`);

				assert.ok(operation.operand1 instanceof AST.ASTNodeOperationBinary);
				assert.strictEqual(operation.operand1.operator, Operator.MUL);
				assert.ok(operation.operand1.operand0 instanceof AST.ASTNodeConstant);
				assert.ok(operation.operand1.operand1 instanceof AST.ASTNodeConstant);
				assert.strictEqual(operation.operand1.operand0.source, `2`);
				assert.strictEqual(operation.operand1.operand1.source, `420`);
			})
		})

		describe('TupleLiteral ::= "[" (","? Expression# ","?)? "]"', () => {
			it('makes an empty ASTNodeTuple.', () => {
				/*
					<Tuple/>
				*/
				assert_arrayLength(DECORATOR_SOLID.decorate(h.tupleLiteralFromSource(`[];`)).children, 0);
			});
			it('makes a nonempty ASTNodeTuple.', () => {
				/*
					<Tuple>
						<Constant source="42"/>
						<Constant source="true"/>
						<Operation source="null || false">...</Operation>
					</Tuple>
				*/
				assert.deepStrictEqual(DECORATOR_SOLID.decorate(h.tupleLiteralFromSource(`
					[
						42,
						true,
						null || false,
					];
				`)).children.map((c) => c.source), [
					`42`,
					`true`,
					`null || false`,
				]);
			});
		});

		describe('RecordLiteral ::= "[" ","? Property# ","? "]"', () => {
			it('makes an ASTNodeRecord.', () => {
				/*
					<Record>
						<Property source="let = true">...</Property>
						<Property source="foobar = 42">...</Property>
					</Record>
				*/
				assert.deepStrictEqual(DECORATOR_SOLID.decorate(h.recordLiteralFromSource(`
					[
						let= true,
						foobar= 42,
					];
				`)).children.map((c) => c.source), [
					`let = true`,
					`foobar = 42`,
				]);
			});
		});

		describe('SetLiteral ::= "{" (","? Expression# ","?)? "}"', () => {
			it('makes an empty ASTNodeSet.', () => {
				/*
					<Set/>
				*/
				assert_arrayLength(DECORATOR_SOLID.decorate(h.setLiteralFromSource(`{};`)).children, 0);
			});
			it('makes a nonempty ASTNodeSet.', () => {
				/*
					<Set>
						<Constant source="42"/>
						<Constant source="true"/>
						<Operation source="null || false">...</Operation>
					</Set>
				*/
				assert.deepStrictEqual(DECORATOR_SOLID.decorate(h.setLiteralFromSource(`
					{
						42,
						true,
						null || false,
					};
				`)).children.map((c) => c.source), [
					`42`,
					`true`,
					`null || false`,
				]);
			});
		});

		describe('MapLiteral ::= "{" ","? Case# ","? "}"', () => {
			it('makes an ASTNodeMap.', () => {
				/*
					<Map>
						<Case source="1 -> null">...</Case>
						<Case source="4 -> false">...</Case>
						<Case source="7 -> true">...</Case>
						<Case source="9 -> 42.0">...</Case>
					</Map>
				*/
				assert.deepStrictEqual(DECORATOR_SOLID.decorate(h.mapLiteralFromSource(`
					{
						1 -> null,
						4 -> false,
						7 -> true,
						9 -> 42.0,
					};
				`)).children.map((c) => c.source), [
					`1 -> null`,
					`4 -> false`,
					`7 -> true`,
					`9 -> 42.0`,
				]);
			});
		});

		describe('FunctionArguments ::= "(" ( ","? Expression# ","? )? ")"', () => {
			it('makes a Vector<Sequence<SemanticType>, Sequence<SemanticExpression>>.', () => {
				/*
					<>
					</>
					<>
						<Operation source="bar || qux">...</Operation>
						<Variable source="diz"/>
					</>
				*/
				const args: PARSENODE.ParseNodeExpressionCompound$ = h.compoundExpressionFromSource(`foo.(bar || qux, diz);`);
				assert_arrayLength(args.children, 2);
				assert.ok(args.children[1] instanceof PARSENODE.ParseNodeFunctionCall);
				const sequence: [AST.ASTNodeType[], AST.ASTNodeExpression[]] = DECORATOR_SOLID.decorate(args.children[1]);
				assert.deepStrictEqual(
					[
						sequence[0],
						sequence[1].map((c) => c.source),
					],
					[
						[],
						[`bar || qux`, `diz`],
					],
				);
			});
		});

		context('ExpressionUnit ::= IDENTIFIER', () => {
			it('makes an ASTNodeVariable.', () => {
				/*
					<Variable source="variable"/>
				*/
				return [
					`variable;`,
					`var;`,
				].forEach((src) => assert.ok(DECORATOR_SOLID.decorate(h.unitExpressionFromSource(src)) instanceof AST.ASTNodeVariable));
			});
		});

		context('ExpressionUnit ::= PrimitiveLiteral', () => {
			it('makes an ASTNodeConstant.', () => {
				/*
					<Constant line="1" col="1" source="null"/>
				*/
				assert.deepStrictEqual([
					`null;`,
					`false;`,
					`true;`,
					`42;`,
				].map((src) => (DECORATOR_SOLID.decorate(h.primitiveLiteralFromSource(src)) as unknown as AST.ASTNodeConstant).source), [
					`null`,
					`false`,
					`true`,
					`42`,
				])
			})
		})

		describe('ExpressionCompound ::= ExpressionCompound (PropertyAccess | FunctionCall)', () => {
			function makeAccess(src: string, kind: ValidAccessOperator = Operator.DOT, config: SolidConfig = CONFIG_DEFAULT): AST.ASTNodeAccess {
				const access: AST.ASTNodeExpression = DECORATOR_SOLID.decorate(h.compoundExpressionFromSource(src, config));
				assert.ok(access instanceof AST.ASTNodeAccess);
				assert.strictEqual(access.kind, kind);
				return access;
			}
			context('normal access.', () => {
				it('access by index.', () => {
					/*
						<Access kind=NORMAL>
							<Tuple source="[42, 420, 4200]">...</Tuple>
							<Index>
								<Constant source="1"/>
							</Index>
						</Access>
					*/
					const access: AST.ASTNodeAccess = makeAccess(`
						[42, 420, 4200].1;
					`);
					assert.ok(access.accessor instanceof AST.ASTNodeIndex);
					assert.deepStrictEqual(
						[access.base.source,    access.accessor.source],
						[`[ 42 , 420 , 4200 ]`, `. 1`],
					);
				});
				it('access by key.', () => {
					/*
						<Access kind=NORMAL>
							<Record source="[c= 42, b= 420, a= 4200]">...</Record>
							<Key source="b"/>
						</Access>
					*/
					const access: AST.ASTNodeAccess = makeAccess(`
						[c= 42, b= 420, a= 4200].b;
					`);
					assert.ok(access.accessor instanceof AST.ASTNodeKey);
					assert.deepStrictEqual(
						[access.base.source,                access.accessor.source],
						[`[ c = 42 , b = 420 , a = 4200 ]`, `b`],
					);
				});
				it('access by computed expression.', () => {
					/*
						<Access kind=NORMAL>
							<Map source="{0.5 * 2 -> 'one', 1.4 + 0.6 -> 'two'}">...</Map>
							<Expression source="0.7 + 0.3">...</Expression>
						</Access>
					*/
					const access: AST.ASTNodeAccess = makeAccess(`
						{0.5 * 2 -> 'one', 1.4 + 0.6 -> 'two'}.[0.7 + 0.3];
					`);
					assert.ok(access.accessor instanceof AST.ASTNodeExpression);
					assert.deepStrictEqual(
						[access.base.source,                            access.accessor.source],
						[`{ 0.5 * 2 -> 'one' , 1.4 + 0.6 -> 'two' }`, `0.7 + 0.3`],
					);
				});
			});
			context('optional access.', () => {
				it('access by index.', () => {
					/*
						<Access kind=OPTIONAL>
							<Tuple source="[42, 420, 4200]">...</Tuple>
							<Index>
								<Constant source="1"/>
							</Index>
						</Access>
					*/
					makeAccess(`
						[42, 420, 4200]?.1;
					`, Operator.OPTDOT);
				});
				it('access by key.', () => {
					/*
						<Access kind=OPTIONAL>
							<Record source="[c= 42, b= 420, a= 4200]">...</Record>
							<Key source="b"/>
						</Access>
					*/
					makeAccess(`
						[c= 42, b= 420, a= 4200]?.b;
					`, Operator.OPTDOT);
				});
				it('access by computed expression.', () => {
					/*
						<Access kind=OPTIONAL>
							<Map source="{0.5 * 2 -> 'one', 1.4 + 0.6 -> 'two'}">...</Map>
							<Expression source="0.7 + 0.3">...</Expression>
						</Access>
					*/
					makeAccess(`
						{0.5 * 2 -> 'one', 1.4 + 0.6 -> 'two'}?.[0.7 + 0.3];
					`, Operator.OPTDOT);
				});
			});
			context('claim access.', () => {
				it('access by index.', () => {
					/*
						<Access kind=CLAIM>
							<Tuple source="[42, 420, 4200]">...</Tuple>
							<Index>
								<Constant source="1"/>
							</Index>
						</Access>
					*/
					makeAccess(`
						[42, 420, 4200]!.1;
					`, Operator.CLAIMDOT);
				});
				it('access by key.', () => {
					/*
						<Access kind=CLAIM>
							<Record source="[c= 42, b= 420, a= 4200]">...</Record>
							<Key source="b"/>
						</Access>
					*/
					makeAccess(`
						[c= 42, b= 420, a= 4200]!.b;
					`, Operator.CLAIMDOT);
				});
				it('access by computed expression.', () => {
					/*
						<Access kind=CLAIM>
							<Map source="{0.5 * 2 -> 'one', 1.4 + 0.6 -> 'two'}">...</Map>
							<Expression source="0.7 + 0.3">...</Expression>
						</Access>
					*/
					makeAccess(`
						{0.5 * 2 -> 'one', 1.4 + 0.6 -> 'two'}!.[0.7 + 0.3];
					`, Operator.CLAIMDOT);
				});
			});
			it('makes an ASTNodeCall.', () => {
				/*
					<Call>
						<Variable source="foo"/>
						<TypeOperation source="Bar | Qux">...</TypeOperation>
						<TypeAlias source="Diz"/>
						<Operation source="bar || qux">...</Operation>
						<Variable source="diz"/>
					</Call>
				*/
				const call: AST.ASTNodeExpression = DECORATOR_SOLID.decorate(h.compoundExpressionFromSource(`foo.<Bar | Qux, Diz>(bar || qux, diz);`));
				assert.ok(call instanceof AST.ASTNodeCall, 'should be instance of ASTNodeCall.');
				assert.deepStrictEqual(
					[call.base, ...call.typeargs, ...call.exprargs].map((c) => c.source),
					[`foo`, `Bar | Qux`, `Diz`, `bar || qux`, `diz`],
				);
			});
		});

		context('ExpressionUnarySymbol ::= ("!" | "?" | "-") ExpressionUnarySymbol', () => {
			it('makes an ASTNodeOperationUnary.', () => {
				/*
					<Operation operator=NEG>
						<Constant source="42"/>
					</Operation>
				*/
				assert.deepStrictEqual([
					`!null;`,
					`?41;`,
					`- 42;`,
				].map((src) => {
					const operation: AST.ASTNodeExpression = DECORATOR_SOLID.decorate(h.expressionFromSource(src));
					assert.ok(operation instanceof AST.ASTNodeOperationUnary);
					assert.ok(operation.operand instanceof AST.ASTNodeConstant);
					return [operation.operand.source, operation.operator];
				}), [
					[`null`, Operator.NOT],
					[`41`,   Operator.EMP],
					[`42`,   Operator.NEG],
				])
			})
		})

		context('ExpressionClaim ::= "<" Type ">" ExpressionClaim', () => {
			it('makes an ASTNodeClaim.', () => {
				/*
					<Claim>
						<TypeConstant source="float"/>
						<Constant source="3"/>
					</Claim>
				*/
				const claim: AST.ASTNodeExpression = DECORATOR_SOLID.decorate(h.claimExpressionFromSource(`<float>3;`));
				assert.ok(claim instanceof AST.ASTNodeClaim);
				assert.ok(claim.claimed_type instanceof AST.ASTNodeTypeConstant);
				assert.ok(claim.operand      instanceof AST.ASTNodeConstant);
				assert.strictEqual(claim.claimed_type.source, `float`);
				assert.strictEqual(claim.operand.source,      `3`);
			});
		});

		context('ExpressionExponential ::= ExpressionClaim ("^" ExpressionExponential)?', () => {
			it('makes an ASTNodeOperationBinary.', () => {
				/*
					<Operation operator=EXP>
						<Constant source="2"/>
						<Constant source="-3"/>
					</Operation>
				*/
				assert.deepStrictEqual([
					`2 ^ -3;`,
					`2 * -3;`,
					`2 + -3;`,
				].map((src) => {
					const operation: AST.ASTNodeExpression = DECORATOR_SOLID.decorate(h.expressionFromSource(src));
					assert.ok(operation instanceof AST.ASTNodeOperationBinary);
					assert.ok(operation.operand0 instanceof AST.ASTNodeConstant);
					assert.ok(operation.operand1 instanceof AST.ASTNodeConstant);
					assert.strictEqual(operation.operand0.source, `2`);
					assert.strictEqual(operation.operand1.source, `-3`);
					return operation.operator
				}), [
					Operator.EXP,
					Operator.MUL,
					Operator.ADD,
				])
			})
		})

		context('ExpressionAdditive ::= ExpressionAdditive "-" ExpressionMultiplicative', () => {
			it('makes an ASTNodeOperation with the `+` operator and negates the 2nd operand.', () => {
				/*
					<Operation operator=ADD>
						<Constant source="2"/>
						<Operation operator=NEG>
							<Constant source="3"/>
						</Operation>
					</Operation>
				*/
				const operation: AST.ASTNodeExpression = DECORATOR_SOLID.decorate(h.expressionFromSource(`2 - 3;`));
				assert.ok(operation instanceof AST.ASTNodeOperationBinary);
				assert.strictEqual(operation.operator, Operator.ADD)
				assert.ok(operation.operand0 instanceof AST.ASTNodeConstant);
				assert.ok(operation.operand1 instanceof AST.ASTNodeOperationUnary);
				assert.ok(operation.operand1.operand instanceof AST.ASTNodeConstant);
				assert.deepStrictEqual(
					[operation.operand0.source, operation.operand1.operator, operation.operand1.operand.source],
					[`2`,                       Operator.NEG,                `3`],
				)
			})
		})

		function testNegatedBinaryOperation(operation: AST.ASTNodeExpression, expected: [string, Operator, string]): void {
			assert.ok(operation instanceof AST.ASTNodeOperationUnary);
			assert.strictEqual(operation.operator, Operator.NOT);
			assert.ok(operation.operand instanceof AST.ASTNodeOperationBinary);
			assert.ok(operation.operand.operand0 instanceof AST.ASTNodeConstant);
			assert.ok(operation.operand.operand1 instanceof AST.ASTNodeConstant);
			return assert.deepStrictEqual(
				[operation.operand.operand0.source, operation.operand.operator, operation.operand.operand1.source],
				expected,
			);
		}

		context('ExpressionComparative ::= ExpressionComparative ("!<" | "!>" | "isnt") ExpressionAdditive', () => {
			it('makes an ASTNodeOperation with the `<` operator and logically negates the result.', () => {
				/*
					<Operation operator=NOT>
						<Operation operator=LT>
							<Constant source="2"/>
							<Constant source="3"/>
						</Operation>
					</Operation>
				*/
				return testNegatedBinaryOperation(
					DECORATOR_SOLID.decorate(h.expressionFromSource(`2 !< 3;`)),
					[`2`, Operator.LT, `3`],
				);
			})
			it('makes an ASTNodeOperation with the `>` operator and logically negates the result.', () => {
				/*
					<Operation operator=NOT>
						<Operation operator=GT>
							<Constant source="2"/>
							<Constant source="3"/>
						</Operation>
					</Operation>
				*/
				return testNegatedBinaryOperation(
					DECORATOR_SOLID.decorate(h.expressionFromSource(`2 !> 3;`)),
					[`2`, Operator.GT, `3`],
				);
			})
			it.skip('makes an ASTNodeOperation with the `is` operator and logically negates the result.', () => {
				/*
					<Operation operator=NOT>
						<Operation operator=IS>
							<Constant source="2"/>
							<Constant source="3"/>
						</Operation>
					</Operation>
				*/
				return testNegatedBinaryOperation(
					DECORATOR_SOLID.decorate(h.expressionFromSource(`2 isnt 3;`)),
					[`2`, Operator.IS, `3`],
				);
			})
			it('operator `is`/`isnt` is not yet supported.', () => {
				assert.throws(() => DECORATOR_SOLID.decorate(h.expressionFromSource(`2 is   2;`)), /not yet supported/);
				assert.throws(() => DECORATOR_SOLID.decorate(h.expressionFromSource(`2 isnt 3;`)), /not yet supported/);
			});
		})

		context('ExpressionEquality ::= ExpressionEquality ("!==" | "!=") ExpressionComparative', () => {
			it('makes an ASTNodeOperation with the `===` operator and logically negates the result.', () => {
				/*
					<Operation operator=NOT>
						<Operation operator=ID>
							<Constant source="2"/>
							<Constant source="3"/>
						</Operation>
					</Operation>
				*/
				return testNegatedBinaryOperation(
					DECORATOR_SOLID.decorate(h.expressionFromSource(`2 !== 3;`)),
					[`2`, Operator.ID, `3`],
				);
			});
			it('makes an ASTNodeOperation with the `==` operator and logically negates the result.', () => {
				/*
					<Operation operator=NOT>
						<Operation operator=EQ>
							<Constant source="2"/>
							<Constant source="3"/>
						</Operation>
					</Operation>
				*/
				return testNegatedBinaryOperation(
					DECORATOR_SOLID.decorate(h.expressionFromSource(`2 != 3;`)),
					[`2`, Operator.EQ, `3`],
				);
			})
		})

		context('ExpressionConjunctive ::= ExpressionConjunctive "!&" ExpressionEquality', () => {
			it('makes an ASTNodeOperation with the `&&` operator and logically negates the result.', () => {
				/*
					<Operation operator=NOT>
						<Operation operator=AND>
							<Constant source="2"/>
							<Constant source="3"/>
						</Operation>
					</Operation>
				*/
				return testNegatedBinaryOperation(
					DECORATOR_SOLID.decorate(h.expressionFromSource(`2 !& 3;`)),
					[`2`, Operator.AND, `3`],
				);
			})
		})

		context('ExpressionDisjunctive ::= ExpressionDisjunctive "!|" ExpressionConjunctive', () => {
			it('makes an ASTNodeOperation with the `||` operator and logically negates the result.', () => {
				/*
					<Operation operator=NOT>
						<Operation operator=OR>
							<Constant source="2"/>
							<Constant source="3"/>
						</Operation>
					</Operation>
				*/
				return testNegatedBinaryOperation(
					DECORATOR_SOLID.decorate(h.expressionFromSource(`2 !| 3;`)),
					[`2`, Operator.OR, `3`],
				);
			})
		})

		context('ExpressionConditional ::= "if" Expression "then" Expression "else" Expression', () => {
			it('makes an ASTNodeOperation with the COND operator and 3 children.', () => {
				/*
					<Operation operator=COND>
						<Constant source="true"/>
						<Constant source="2"/>
						<Constant source="3"/>
					</Operation>
				*/
				const operation: AST.ASTNodeExpression = DECORATOR_SOLID.decorate(h.expressionFromSource(`if true then 2 else 3;`));
				assert.ok(operation instanceof AST.ASTNodeOperationTernary);
				assert.deepStrictEqual([
					operation.operand0,
					operation.operand1,
					operation.operand2,
				].map((child) => {
					assert.ok(child instanceof AST.ASTNodeConstant);
					return child.source;
				}), [
					`true`,
					`2`,
					`3`,
				])
			})
		})

		describe('DeclarationType ::= "type" IDENTIFIER "=" Type ";"', () => {
			it('makes an ASTNodeDeclarationType node.', () => {
				/*
					<DeclarationType>
						<Variable source="T" id=256n/>
						<TypeOperation operator=OR source="int | float">...</TypeOperation>
					</DeclarationType>
				*/
				const decl: AST.ASTNodeDeclarationType = DECORATOR_SOLID.decorate(h.typeDeclarationFromSource(`
					type T  =  int | float;
				`));
				assert.ok(decl.assigned instanceof AST.ASTNodeTypeOperationBinary);
				assert.deepStrictEqual(
					[decl.assignee.source, decl.assigned.source, decl.assigned.operator],
					[`T`,                  `int | float`,        Operator.OR],
				);
			});
		});

		describe('DeclarationVariable ::= "let" "unfixed"? IDENTIFIER ":" Type "=" Expression ";"', () => {
			it('makes an unfixed ASTNodeDeclarationVariable node.', () => {
				/*
					<DeclarationVariable unfixed=true>
						<Variable source="the_answer" id=256n/>
						<TypeOperation operator=OR source="int | float">...</TypeOperation>
						<Operation operator=MUL source="21 * 2">...</Operation>
					</DeclarationVariable>
				*/
				const decl: AST.ASTNodeDeclarationVariable = DECORATOR_SOLID.decorate(h.variableDeclarationFromSource(`
					let unfixed the_answer:  int | float =  21  *  2;
				`));
				assert.ok(decl.typenode instanceof AST.ASTNodeTypeOperationBinary);
				assert.ok(decl.assigned instanceof AST.ASTNodeOperationBinary);
				assert.deepStrictEqual(
					[decl.unfixed, decl.assignee.source, decl.typenode.source, decl.typenode.operator, decl.assigned.source, decl.assigned.operator],
					[true,         `the_answer`,         `int | float`,        Operator.OR,            `21 * 2`,             Operator.MUL],
				);
			})
			it('makes a fixed ASTNodeDeclarationVariable node.', () => {
				/*
					<DeclarationVariable unfixed=false>
						<Variable source="`the £ answer`" id=256n/>
						<TypeConstant source="int | float">...</TypeOperation>
						<Operation operator=MUL source="the_answer * 10">
							<Variable source="the_answer" id=257n/>
							<Constant source="10"/>
						</Operation>
					</DeclarationVariable>
				*/
				const decl: AST.ASTNodeDeclarationVariable = DECORATOR_SOLID.decorate(h.variableDeclarationFromSource(`
					let \`the £ answer\`: int = the_answer * 10;
				`));
				assert.ok(decl.typenode instanceof AST.ASTNodeTypeConstant);
				assert.ok(decl.assigned instanceof AST.ASTNodeOperationBinary);
				assert.ok(decl.assigned.operand0 instanceof AST.ASTNodeVariable);
				assert.deepStrictEqual(
					[decl.unfixed, decl.assignee.source, decl.typenode.source, decl.assigned.source, decl.assigned.operator],
					[false,        `\`the £ answer\``,   `int`,                `the_answer * 10`,    Operator.MUL],
				);
			})
		})

		describe('Assignee ::= IDENTIFIER', () => {
			it('makes an ASTNodeVariable node.', () => {
				/*
					<Variable source="the_answer" id=256n/>
				*/
				const variable: AST.ASTNodeVariable = (DECORATOR_SOLID.decorate(h.assigneeFromSource(`
					the_answer = the_answer - 40;
				`)) as AST.ASTNodeVariable);
				assert.strictEqual(variable.source, `the_answer`);
			});
		});

		describe('Assignee ::= ExpressionCompound PropertyAssign', () => {
			it('makes an ASTNodeAccess node.', () => {
				/*
					<Access source="x.().y.z" kind=NORMAL>
						<Access source="x.().y">...</Access>
						<Key source="z"/>
					</Access>
				*/
				const access: AST.ASTNodeAccess = (DECORATOR_SOLID.decorate(h.assigneeFromSource(`
					x.().y.z = a;
				`)) as AST.ASTNodeAccess);
				const base: AST.ASTNodeExpression = access.base;
				const accessor: AST.ASTNodeIndex | AST.ASTNodeKey | AST.ASTNodeExpression = access.accessor;
				assert.ok(accessor instanceof AST.ASTNodeKey);
				assert.deepStrictEqual(
					[access.source,     base.source,   accessor.source],
					[`x . ( ) . y . z`, `x . ( ) . y`, `z`],
				);
			});
		});

		describe('StatementAssignment ::= Assignee "=" Expression ";"', () => {
			it('makes an ASTNodeAssignment node.', () => {
				/*
					<Assignment>
						<Variable source="the_answer">...</Variable>
						<Operation operator=ADD source="the_answer - 40">
							<Variable source="the_answer" id="256"/>
							<Operation operator=NEG source="40">...</Operation>
						</Operation>
					</Assignment>
				*/
				const assn: AST.ASTNodeAssignment = DECORATOR_SOLID.decorate(h.assignmentFromSource(`
					the_answer = the_answer - 40;
				`));
				assert.ok(assn.assigned instanceof AST.ASTNodeOperationBinary);
				assert.ok(assn.assigned.operand0 instanceof AST.ASTNodeVariable);
				assert.deepStrictEqual(
					[assn.assignee.source, assn.assigned.source, assn.assigned.operator],
					[`the_answer`,         `the_answer - 40`,    Operator.ADD],
				);
			})
		})

		context('Statement ::= ";"', () => {
			it('makes an ASTNodeStatementExpression node containing no children.', () => {
				const statement: AST.ASTNodeStatement = DECORATOR_SOLID.decorate(h.statementFromSource(`;`));
				assert.ok(statement instanceof AST.ASTNodeStatementExpression);
				assert.ok(!statement.expr, 'semantic statement should have 0 children');
				assert.strictEqual(statement.source, `;`)
			})
		})

		context('Goal ::= #x02 Statement* #x03', () => {
			it('makes an ASTNodeGoal node containing no children.', () => {
				const goal: AST.ASTNodeGoal = DECORATOR_SOLID.decorate(h.goalFromSource(``));
				assert_arrayLength(goal.children, 0, 'semantic goal should have 0 children')
			})
			it('decorates multiple statements.', () => {
				/*
					<Goal>
						<StatementExpression source="42 ;">...</StatementExpression>
						<StatementExpression source="420 ;">...</StatementExpression>
					</Goal>
				*/
				const goal: AST.ASTNodeGoal = DECORATOR_SOLID.decorate(h.goalFromSource(`42; 420;`));
				assert_arrayLength(goal.children, 2, 'goal should have 2 children')
				assert.deepStrictEqual(goal.children.map((stat) => {
					assert.ok(stat instanceof AST.ASTNodeStatementExpression);
					return stat.source
				}), ['42 ;', '420 ;'])
			})
		})
	})


	describe('#decorateTS', () => {
		const parser: Parser = new Parser();
		parser.setLanguage(Counterpoint);
		function captureParseNode(source: string, query: string): SyntaxNode {
			const captures: QueryCapture[] = new Query(Counterpoint, `${ query } @capt`).captures(parser.parse(source).rootNode);
			assert.ok(captures.length, 'could not find any captures.');
			return captures[0].node;
		}
		new Map<string, [NewableFunction, string]>([
			['Decorate(Word ::= _KEYWORD_OTHER) -> SemanticKey', [AST.ASTNodeKey, `
				[mutable= 42];
				% (word "mutable")
			`]],
			['Decorate(Word ::= KEYWORD_TYPE) -> SemanticKey', [AST.ASTNodeKey, `
				[void= 42];
				% (word (keyword_type))
			`]],
			['Decorate(Word ::= KEYWORD_VALUE) -> SemanticKey', [AST.ASTNodeKey, `
				[true= 42];
				% (word (keyword_value))
			`]],
			['Decorate(Word ::= IDENTIFIER) -> SemanticKey', [AST.ASTNodeKey, `
				[foobar= 42];
				% (word (identifier))
			`]],

			['Decorate(Type > PrimitiveLiteral ::= KEYWORD_VALUE) -> SemanticTypeConstant', [AST.ASTNodeTypeConstant, `
				type T = false;
				% (primitive_literal (keyword_value))
			`]],
			['Decorate(Type > PrimitiveLiteral ::= INTEGER) -> SemanticTypeConstant', [AST.ASTNodeTypeConstant, `
				type T = 42;
				% (primitive_literal (integer))
			`]],
			['Decorate(Type > PrimitiveLiteral ::= FLOAT) -> SemanticTypeConstant', [AST.ASTNodeTypeConstant, `
				type T = 42.69;
				% (primitive_literal (float))
			`]],
			['Decorate(Type > PrimitiveLiteral ::= STRING) -> SemanticTypeConstant', [AST.ASTNodeTypeConstant, `
				type T = 'hello';
				% (primitive_literal (string))
			`]],

			['Decorate(Expression > PrimitiveLiteral ::= KEYWORD_VALUE) -> SemanticConstant', [AST.ASTNodeConstant, `
				false;
				% (primitive_literal (keyword_value))
			`]],
			['Decorate(Expression > PrimitiveLiteral ::= INTEGER) -> SemanticConstant', [AST.ASTNodeConstant, `
				42;
				% (primitive_literal (integer))
			`]],
			['Decorate(Expression > PrimitiveLiteral ::= FLOAT) -> SemanticConstant', [AST.ASTNodeConstant, `
				42.69;
				% (primitive_literal (float))
			`]],
			['Decorate(Expression > PrimitiveLiteral ::= STRING) -> SemanticConstant', [AST.ASTNodeConstant, `
				'hello';
				% (primitive_literal (string))
			`]],

			/* ## Types */
			['Decorate(EntryType<-Named><-Optional> ::= Type) -> SemanticItemType', [AST.ASTNodeItemType, `
				type T = [int];
				% (entry_type)
			`]],
			['Decorate(EntryType<-Named><+Optional> ::= "?:" Type) -> SemanticItemType', [AST.ASTNodeItemType, `
				type T = [?: int];
				% (entry_type__optional)
			`]],
			['Decorate(EntryType<+Named><-Optional> ::= Word ":" Type) -> SemanticPropertyType', [AST.ASTNodePropertyType, `
				type T = [a: int];
				% (entry_type__named)
			`]],
			['Decorate(EntryType<+Named><+Optional> ::= Word "?:" Type) -> SemanticPropertyType', [AST.ASTNodePropertyType, `
				type T = [a?: int];
				% (entry_type__named__optional)
			`]],

			['Decorate(TypeGrouped ::= "(" Type ")") -> SemanticType', [AST.ASTNodeType, `
				type T = (int | float);
				% (type_grouped)
			`]],

			['Decorate(TypeTupleLiteral ::= "[" ","? ItemsType "]") -> SemanticTypeTuple', [AST.ASTNodeTypeTuple, `
				type T = [int, ?: float];
				% (type_tuple_literal)
			`]],

			['Decorate(TypeRecordLiteral ::= "[" ","? PropertiesType "]") -> SemanticTypeRecord', [AST.ASTNodeTypeRecord, `
				type T = [a?: int, b: float];
				% (type_record_literal)
			`]],

			['Decorate(TypeHashLiteral ::= "[" ":" Type "]") -> SemanticTypeHash', [AST.ASTNodeTypeHash, `
				type T = [:int];
				% (type_hash_literal)
			`]],

			['Decorate(TypeMapLiteral ::= "{" Type__0 "->" Type__1 "}") -> SemanticTypeMap', [AST.ASTNodeTypeMap, `
				type T = {int -> float};
				% (type_map_literal)
			`]],

			['Decorate(PropertyAccessType ::= "." INTEGER) -> SemanticIndexType', [AST.ASTNodeIndexType, `
				type T = U.1;
				% (property_access_type)
			`]],
			['Decorate(PropertyAccessType ::= "." Word) -> SemanticKey', [AST.ASTNodeKey, `
				type T = U.p;
				% (property_access_type)
			`]],

			['Decorate(TypeCompound ::= TypeCompound PropertyAccessType) -> SemanticTypeAccess', [AST.ASTNodeTypeAccess, `
				type T = U.p;
				% (type_compound)
			`]],
			['Decorate(TypeCompound ::= TypeCompound GenericCall) -> SemanticTypeCall', [AST.ASTNodeTypeCall, `
				type T = List.<U>;
				% (type_compound)
			`]],

			['Decorate(TypeUnarySymbol ::= TypeUnarySymbol "?") -> SemanticTypeOperation', [AST.ASTNodeTypeOperation, `
				type T = U?;
				% (type_unary_symbol)
			`]],
			['skip: Decorate(TypeUnarySymbol ::= TypeUnarySymbol "!") -> SemanticTypeOperation', [AST.ASTNodeTypeOperation, `
				type T = U!;
				% (type_unary_symbol)
			`]],
			['Decorate(TypeUnarySymbol ::= TypeUnarySymbol "[" "]") -> SemanticTypeList', [AST.ASTNodeTypeList, `
				type T = U[];
				% (type_unary_symbol)
			`]],
			['Decorate(TypeUnarySymbol ::= TypeUnarySymbol "[" INTEGER "]") -> SemanticTypeList', [AST.ASTNodeTypeList, `
				type T = U[3];
				% (type_unary_symbol)
			`]],
			['Decorate(TypeUnarySymbol ::= TypeUnarySymbol "{" "}") -> SemanticTypeSet', [AST.ASTNodeTypeSet, `
				type T = U{};
				% (type_unary_symbol)
			`]],

			['Decorate(TypeUnaryKeyword ::= "mutable" TypeUnaryKeyword) -> SemanticTypeOperation', [AST.ASTNodeTypeOperation, `
				type T = mutable U;
				% (type_unary_keyword)
			`]],

			['Decorate(TypeIntersection ::= TypeIntersection "&" TypeUnaryKeyword) -> SemanticTypeOperation', [AST.ASTNodeTypeOperation, `
				type T = U & V;
				% (type_intersection)
			`]],

			['Decorate(TypeUnion ::= TypeUnion "|" TypeIntersection) -> SemanticTypeOperation', [AST.ASTNodeTypeOperation, `
				type T = U | V;
				% (type_union)
			`]],

			/* ## Expressions */
			['Decorate(StringTemplate ::= TEMPLATE_FULL) -> SemanticTemplate', [AST.ASTNodeTemplate, `
				'''full1''';
				% (string_template)
			`]],
			['Decorate(StringTemplate ::= TEMPLATE_HEAD Expression? (TEMPLATE_MIDDLE Expression?)* TEMPLATE_TAIL) -> SemanticTemplate', [AST.ASTNodeTemplate, `
				'''hello {{ 'to' }} the {{ 'whole' }} great {{ 'big' }} world''';
				% (string_template)
			`]],
			['Decorate(StringTemplate ::= TEMPLATE_HEAD Expression? (TEMPLATE_MIDDLE Expression?)* TEMPLATE_TAIL) -> SemanticTemplate', [AST.ASTNodeTemplate, `
				'''hello {{ '''to {{ '''the {{ 'whole' }} great''' }} big''' }} world''';
				% (string_template)
			`]],

			['Decorate(Property ::= Word "=" Expression) -> SemanticProperty', [AST.ASTNodeProperty, `
				[a= 42];
				% (property)
			`]],

			['Decorate(Case ::= Expression "->" Expression) -> SemanticCase', [AST.ASTNodeCase, `
				{42 -> 6.9};
				% (case)
			`]],

			['Decorate(ExpressionGrouped ::= "(" Expression ")") -> SemanticExpression', [AST.ASTNodeExpression, `
				(42 || 6.9);
				% (expression_grouped)
			`]],

			['Decorate(TupleLiteral ::= "[" ","? Expression# ","? "]") -> SemanticTuple', [AST.ASTNodeTuple, `
				[42, 6.9];
				% (tuple_literal)
			`]],

			['Decorate(RecordLiteral ::= "[" ","? Property# ","? "]") -> SemanticRecord', [AST.ASTNodeRecord, `
				[a= 42, b= 6.9];
				% (record_literal)
			`]],

			['Decorate(SetLiteral ::= "{" ","? Expression# ","? "}") -> SemanticSet', [AST.ASTNodeSet, `
				{42, 6.9};
				% (set_literal)
			`]],

			['Decorate(MapLiteral ::= "{" ","? Case# ","? "}") -> SemanticMap', [AST.ASTNodeMap, `
				{42 -> 6.9, 'hello' -> true};
				% (map_literal)
			`]],

			['Decorate(PropertyAccess ::= ("." | "?." | "!.") INTEGER) -> SemanticIndex', [AST.ASTNodeIndex, `
				v.1;
				% (property_access)
			`]],
			['Decorate(PropertyAccess ::= ("." | "?." | "!.") Word) -> SemanticKey', [AST.ASTNodeKey, `
				v?.p;
				% (property_access)
			`]],
			['Decorate(PropertyAccess ::= ("." | "?." | "!.") "[" Expression "]") -> SemanticExpression', [AST.ASTNodeExpression, `
				v!.[a + b];
				% (property_access)
			`]],

			['Decorate(PropertyAssign ::= "." INTEGER) -> SemanticIndex', [AST.ASTNodeIndex, `
				v.1 = false;
				% (property_assign)
			`]],
			['Decorate(PropertyAssign ::= "." Word) -> SemanticKey', [AST.ASTNodeKey, `
				v.p = false;
				% (property_assign)
			`]],
			['Decorate(PropertyAssign ::= "." "[" Expression "]") -> SemanticExpression', [AST.ASTNodeExpression, `
				v.[a + b] = false;
				% (property_assign)
			`]],

			['Decorate(ExpressionCompound ::= ExpressionCompound PropertyAccess) -> SemanticAccess', [AST.ASTNodeAccess, `
				v.p;
				% (expression_compound)
			`]],
			['Decorate(ExpressionCompound ::= ExpressionCompound FunctionCall) -> SemanticCall', [AST.ASTNodeCall, `
				List.<T>();
				% (expression_compound)
			`]],

			['Decorate(Assignee ::= IDENTIFIER) -> SemanticVariable', [AST.ASTNodeVariable, `
				v = 42;
				% (assignee)
			`]],
			['Decorate(Assignee ::= ExpressionCompound PropertyAssign) -> SemanticAccess', [AST.ASTNodeAccess, `
				v.1 = 42;
				% (assignee)
			`]],

			['Decorate(ExpressionUnarySymbol ::= "!" ExpressionUnarySymbol) -> SemanticOperation', [AST.ASTNodeOperation, `
				!v;
				% (expression_unary_symbol)
			`]],
			['Decorate(ExpressionUnarySymbol ::= "?" ExpressionUnarySymbol) -> SemanticOperation', [AST.ASTNodeOperation, `
				?v;
				% (expression_unary_symbol)
			`]],
			['Decorate(ExpressionUnarySymbol ::= "+" ExpressionUnarySymbol) -> SemanticExpression', [AST.ASTNodeExpression, `
				+v;
				% (expression_unary_symbol)
			`]],
			['Decorate(ExpressionUnarySymbol ::= "-" ExpressionUnarySymbol) -> SemanticOperation', [AST.ASTNodeOperation, `
				-v;
				% (expression_unary_symbol)
			`]],

			['Decorate(ExpressionClaim ::= "<" Type ">" ExpressionClaim) -> SemanticOperation', [AST.ASTNodeClaim, `
				<T>a;
				% (expression_claim)
			`]],

			['Decorate(ExpressionExponential ::= ExpressionClaim "^" ExpressionExponential) -> SemanticOperation', [AST.ASTNodeOperation, `
				a ^ b;
				% (expression_exponential)
			`]],

			['Decorate(ExpressionMultiplicative ::= ExpressionMultiplicative "*" ExpressionExponential) -> SemanticOperation', [AST.ASTNodeOperation, `
				a * b;
				% (expression_multiplicative)
			`]],
			['Decorate(ExpressionMultiplicative ::= ExpressionMultiplicative "/" ExpressionExponential) -> SemanticOperation', [AST.ASTNodeOperation, `
				a / b;
				% (expression_multiplicative)
			`]],

			['Decorate(ExpressionAdditive ::= ExpressionAdditive "+" ExpressionMultiplicative) -> SemanticOperation', [AST.ASTNodeOperation, `
				a + b;
				% (expression_additive)
			`]],
			['Decorate(ExpressionAdditive ::= ExpressionAdditive "-" ExpressionMultiplicative) -> SemanticOperation', [AST.ASTNodeOperation, `
				a - b;
				% (expression_additive)
			`]],

			...['<', '>', '<=', '>=', '!<', '!>', /* 'is', 'isnt' */].map((op) => [`Decorate(ExpressionComparative ::= ExpressionComparative "${ op }" ExpressionAdditive) -> SemanticOperation`, [AST.ASTNodeOperation, `
				a ${ op } b;
				% (expression_comparative)
			`]] as [string, [NewableFunction, string]]),

			...['===', '!==', '==', '!='].map((op) => [`Decorate(ExpressionEquality ::= ExpressionEquality "${ op }" ExpressionComparative) -> SemanticOperation`, [AST.ASTNodeOperation, `
				a ${ op } b;
				% (expression_equality)
			`]] as [string, [NewableFunction, string]]),

			['Decorate(ExpressionConjunctive ::= ExpressionConjunctive "&&" ExpressionEquality) -> SemanticOperation', [AST.ASTNodeOperation, `
				a && b;
				% (expression_conjunctive)
			`]],
			['Decorate(ExpressionConjunctive ::= ExpressionConjunctive "!&" ExpressionEquality) -> SemanticOperation', [AST.ASTNodeOperation, `
				a !& b;
				% (expression_conjunctive)
			`]],

			['Decorate(ExpressionDisjunctive ::= ExpressionDisjunctive "||" ExpressionConjunctive) -> SemanticOperation', [AST.ASTNodeOperation, `
				a || b;
				% (expression_disjunctive)
			`]],
			['Decorate(ExpressionDisjunctive ::= ExpressionDisjunctive "!|" ExpressionConjunctive) -> SemanticOperation', [AST.ASTNodeOperation, `
				a !| b;
				% (expression_disjunctive)
			`]],

			['Decorate(ExpressionConditional ::= "if" Expression "then" Expression "else" Expression) -> SemanticOperation', [AST.ASTNodeOperation, `
				if a then b else c;
				% (expression_conditional)
			`]],

			/* ## Statements */
			['Decorate(DeclarationType ::= "type" IDENTIFIER "=" Type ";") -> SemanticDeclarationType', [AST.ASTNodeDeclarationType, `
				type T = U;
				% (declaration_type)
			`]],

			['Decorate(DeclarationVariable ::= "let" IDENTIFIER ":" Type "=" Expression ";") -> SemanticDeclarationVariable', [AST.ASTNodeDeclarationVariable, `
				let a: T = b;
				% (declaration_variable)
			`]],
			['Decorate(DeclarationVariable ::= "let" "unfixed" IDENTIFIER ":" Type "=" Expression ";") -> SemanticDeclarationVariable', [AST.ASTNodeDeclarationVariable, `
				let unfixed a: T = b;
				% (declaration_variable)
			`]],

			['Decorate(StatementExpression ::= Expression ";") -> SemanticStatementExpression', [AST.ASTNodeStatementExpression, `
				a;
				% (statement_expression)
			`]],

			['Decorate(StatementAssignment ::= Assignee "=" Expression ";") -> SemanticAssignment', [AST.ASTNodeAssignment, `
				a = b;
				% (statement_assignment)
			`]],
		]).forEach(([klass, text], description) => (description.slice(0, 5) === 'skip:' ? specify.skip : specify)(description, () => {
			const parsenode: SyntaxNode = captureParseNode(...text.split('%') as [string, string]);
			return assert.ok(
				DECORATOR_SOLID.decorateTS(parsenode) instanceof klass,
				`\`${ parsenode.text }\` not an instance of ${ klass.name }.`,
			);
		}));
		describe('Decorate(TypeUnarySymbol ::= TypeUnarySymbol "!") -> SemanticTypeOperation', () => {
			it('type operator `!` is not yet supported.', () => {
				return assert.throws(() => DECORATOR_SOLID.decorateTS(captureParseNode(`
					type T = U!;
				`, '(type_unary_symbol)')), /not yet supported/);
			});
		});
		['is', 'isnt'].forEach((op) => describe(`Decorate(ExpressionComparative ::= ExpressionComparative "${ op }" ExpressionAdditive) -> SemanticOperation`, () => {
			it(`operator \`${ op }\` is not yet supported.`, () => {
				return assert.throws(() => DECORATOR_SOLID.decorateTS(captureParseNode(`
					a ${ op } b;
				`, '(expression_comparative)')), /not yet supported/);
			});
		}));
	});
})
