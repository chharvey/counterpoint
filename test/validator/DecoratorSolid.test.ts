import * as assert from 'assert'
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
					<Key source="let" id=\x8f/>
					<Key source="foobar" id=\x100/>
				*/
				const srcs: string[] = [
					`let`,
					`foobar`,
				];
				assert.deepStrictEqual(
					srcs.map((src) => {
						const key: AST.ASTNodeKey = DECORATOR_SOLID.decorate(h.wordFromString(src));
						return [key.source, key.id];
					}),
					srcs.map((src, i) => [src, [
						0x90n,
						0x100n,
					][i]]),
				);
			});
		});

		describe('PrimitiveLiteral ::= "null" | "false" | "true" | INTEGER | FLOAT | STRING', () => {
			it('makes an ASTNodeConstant.', () => {
				/*
					<Constant source="null"/>
				*/
				assert.deepStrictEqual([
					`null`,
					`false`,
					`true`,
					`42`,
					`4.2`,
					`'hello'`,
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
				assert.deepStrictEqual(AST.ASTNodeTypeRecord.fromSource(`
					[
						let: bool,
						foobar: int,
						diz?: str,
						qux: null,
					]
				`).children.map((c) => c.source), [
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
					<TypeAlias source="Foo" id=257/>
				*/
				assert.deepStrictEqual([
					`Foo`,
					`Bar`,
					`Qux`,
				].map((src) => {
					const constant: AST.ASTNodeType = DECORATOR_SOLID.decorate(h.unitTypeFromString(src));
					assert.ok(constant instanceof AST.ASTNodeTypeAlias);
					return constant.id;
				}), [
					// 257 because `T` is 256 from `type T = ` in `unitTypeFromString`
					257n,
					257n,
					257n,
				]);
			});
			it('assigns a unique ID starting from 256.', () => {
				/*
					<TypeOperation operator=OR>
						<TypeAlias source="Foo" id=256/>
						<TypeAlias source="Bar" id=257/>
					</TypeOperation>
				*/
				assert.deepStrictEqual(DECORATOR_SOLID.decorate(h.unionTypeFromString(`Foo | Bar`)).children.map((op) => {
					assert.ok(op instanceof AST.ASTNodeTypeAlias);
					return op.id;
				}), [257n, 258n]);
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
				const access: AST.ASTNodeTypeAccess = AST.ASTNodeTypeAccess.fromSource(`
					[42, 420, 4200].1
				`);
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
				const access: AST.ASTNodeTypeAccess = AST.ASTNodeTypeAccess.fromSource(`
					[c: 42, b: 420, a: 4200].b
				`);
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
					'''full1'''
				`), `'''full1'''`);
			});
			specify('StringTemplate ::= TEMPLATE_HEAD TEMPLATE_TAIL', () => {
				templateSources(h.stringTemplateFromSource(`
					'''head1{{}}tail1'''
				`), `'''head1{{`, `}}tail1'''`);
			});
			specify('StringTemplate ::= TEMPLATE_HEAD Expression TEMPLATE_TAIL', () => {
				templateSources(h.stringTemplateFromSource(`
					'''head1{{ '''full1''' }}tail1'''
				`), `'''head1{{`, `'''full1'''`, `}}tail1'''`);
			});
			specify('StringTemplate ::= TEMPLATE_HEAD StringTemplate__0__List TEMPLATE_TAIL', () => {
				templateSources(h.stringTemplateFromSource(`
					'''head1{{}}midd1{{}}tail1'''
				`), `'''head1{{`, `}}midd1{{`, `}}tail1'''`);
			});
			specify('StringTemplate ::= TEMPLATE_HEAD Expression StringTemplate__0__List TEMPLATE_TAIL', () => {
				templateSources(h.stringTemplateFromSource(`
					'''head1{{ '''full1''' }}midd1{{}}tail1'''
				`), `'''head1{{`, `'''full1'''`, `}}midd1{{`, `}}tail1'''`);
			});

			specify('StringTemplate__0__List ::= TEMPLATE_MIDDLE Expression', () => {
				templateSources(h.stringTemplateFromSource(`
					'''head1{{ '''full1''' }}midd1{{ '''full2''' }}tail1'''
				`), `'''head1{{`, `'''full1'''`, `}}midd1{{`, `'''full2'''`, `}}tail1'''`);
			});
			specify('StringTemplate__0__List ::= StringTemplate__0__List TEMPLATE_MIDDLE', () => {
				templateSources(h.stringTemplateFromSource(`
					'''head1{{ '''full1''' }}midd1{{ '''full2''' }}midd2{{}}tail1'''
				`), `'''head1{{`, `'''full1'''`, `}}midd1{{`, `'''full2'''`, `}}midd2{{`, `}}tail1'''`);
			});
			specify('StringTemplate__0__List ::= StringTemplate__0__List TEMPLATE_MIDDLE Expression', () => {
				templateSources(h.stringTemplateFromSource(`
					'''head1{{ '''full1''' }}midd1{{ '''full2''' }}midd2{{ '''head2{{ '''full3''' }}tail2''' }}tail1'''
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

		describe('TupleLiteral ::= "[" (","? Expression# ","?)? "]"', () => {
			it('makes an empty ASTNodeTuple.', () => {
				/*
					<Tuple/>
				*/
				assert_arrayLength(DECORATOR_SOLID.decorate(h.tupleLiteralFromSource(`[]`)).children, 0);
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
					]
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
					]
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
				assert_arrayLength(DECORATOR_SOLID.decorate(h.setLiteralFromSource(`{}`)).children, 0);
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
					}
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
					}
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
				const args: PARSENODE.ParseNodeExpressionCompound = h.compoundExpressionFromSource(`foo.(bar || qux, diz)`);
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
			it('assigns a unique ID starting from 256.', () => {
				/*
					<Variable source="variable" id="256"/>
				*/
				assert.deepStrictEqual([
					`variable`,
					`var`,
				].map((src) => {
					const variable: AST.ASTNodeExpression = DECORATOR_SOLID.decorate(h.unitExpressionFromSource(src));
					assert.ok(variable instanceof AST.ASTNodeVariable)
					return variable.id;
				}), [
					256n,
					256n,
				]);
			});
			it('increments IDs for each variable.', () => {
				/*
					<Operation operator=OR>
						<Variable source="variable" id="256"/>
						<Variable source="var" id="257"/>
					</Operation>
				*/
				assert.deepStrictEqual(DECORATOR_SOLID.decorate(h.expressionFromSource(`
					variable || var
				`)).children.map((op) => {
					assert.ok(op instanceof AST.ASTNodeVariable);
					return op.id;
				}), [256n, 257n]);
			});
			it('increments IDs even across statements.', () => {
				/*
					<Goal source="␂ variable ; var ; ␃">
						<StatementExpression>
							<Variable source="variable" id="256"/>
						</StatementExpression>
						<StatementExpression>
							<Variable source="var" id="257"/>
						</StatementExpression>
					</Goal>
				*/
				const block: AST.ASTNodeBlock = DECORATOR_SOLID.decorate(h.blockFromSource(`{
					variable;
					var;
				}`));
				assert_arrayLength(block.children, 2);
				assert.deepStrictEqual(block.children.map((stmt) => {
					assert.ok(stmt instanceof AST.ASTNodeStatementExpression);
					const ident: AST.ASTNodeExpression | null = stmt.expr || null;
					assert.ok(ident instanceof AST.ASTNodeVariable);
					return ident.id;
				}), [256n, 257n]);
			});
		});

		context('ExpressionUnit ::= PrimitiveLiteral', () => {
			it('makes an ASTNodeConstant.', () => {
				/*
					<Constant line="1" col="1" source="null"/>
				*/
				assert.deepStrictEqual([
					`null`,
					`false`,
					`true`,
					`42`,
				].map((src) => (DECORATOR_SOLID.decorate(h.primitiveLiteralFromSource(src)) as unknown as AST.ASTNodeConstant).source), [
					`null`,
					`false`,
					`true`,
					`42`,
				])
			})
		})

		context('ExpressionUnit ::= "(" Expression ")"', () => {
			it('returns the inner Expression node.', () => {
				/*
					<Operation operator=ADD>
						<Constant source="2"/>
						<Constant source="-3"/>
					</Operation>
				*/
				const operation: AST.ASTNodeExpression = DECORATOR_SOLID.decorate(h.expressionFromSource(`(2 + -3)`));
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
				const operation: AST.ASTNodeExpression = DECORATOR_SOLID.decorate(h.expressionFromSource(`(-(42) ^ +(2 * 420))`));
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
						[42, 420, 4200].1
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
						[c= 42, b= 420, a= 4200].b
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
						{0.5 * 2 -> 'one', 1.4 + 0.6 -> 'two'}.[0.7 + 0.3]
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
						[42, 420, 4200]?.1
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
						[c= 42, b= 420, a= 4200]?.b
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
						{0.5 * 2 -> 'one', 1.4 + 0.6 -> 'two'}?.[0.7 + 0.3]
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
						[42, 420, 4200]!.1
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
						[c= 42, b= 420, a= 4200]!.b
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
						{0.5 * 2 -> 'one', 1.4 + 0.6 -> 'two'}!.[0.7 + 0.3]
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
				const call: AST.ASTNodeExpression = DECORATOR_SOLID.decorate(h.compoundExpressionFromSource(`foo.<Bar | Qux, Diz>(bar || qux, diz)`));
				assert.ok(call instanceof AST.ASTNodeCall, 'should be instance of ASTNodeCall.');
				assert.deepStrictEqual(
					[call.base, ...call.typeargs, ...call.exprargs].map((c) => c.source),
					[`foo`, `Bar | Qux`, `Diz`, `bar || qux`, `diz`],
				);
			});
		});

		describe('Assignee ::= IDENTIFIER', () => {
			it('makes an ASTNodeVariable node.', () => {
				/*
					<Variable source="the_answer" id=256n/>
				*/
				const variable: AST.ASTNodeVariable = (DECORATOR_SOLID.decorate(h.assigneeFromSource(`
					the_answer = the_answer - 40;
				`)) as AST.ASTNodeVariable);
				assert.strictEqual(variable.id, 256n);
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

		context('ExpressionUnarySymbol ::= ("!" | "?" | "-") ExpressionUnarySymbol', () => {
			it('makes an ASTNodeOperationUnary.', () => {
				/*
					<Operation operator=NEG>
						<Constant source="42"/>
					</Operation>
				*/
				assert.deepStrictEqual([
					`!null`,
					`?41`,
					`- 42`,
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
				const claim: AST.ASTNodeExpression = DECORATOR_SOLID.decorate(h.claimExpressionFromSource(`<float>3`));
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
					`2 ^ -3`,
					`2 * -3`,
					`2 + -3`,
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
				const operation: AST.ASTNodeExpression = DECORATOR_SOLID.decorate(h.expressionFromSource(`2 - 3`));
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
					DECORATOR_SOLID.decorate(h.expressionFromSource(`2 !< 3`)),
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
					DECORATOR_SOLID.decorate(h.expressionFromSource(`2 !> 3`)),
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
					DECORATOR_SOLID.decorate(h.expressionFromSource(`2 isnt 3`)),
					[`2`, Operator.IS, `3`],
				);
			})
			it('operator `is`/`isnt` is not yet supported.', () => {
				assert.throws(() => DECORATOR_SOLID.decorate(h.expressionFromSource(`2 is   2`)), /not yet supported/);
				assert.throws(() => DECORATOR_SOLID.decorate(h.expressionFromSource(`2 isnt 3`)), /not yet supported/);
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
					DECORATOR_SOLID.decorate(h.expressionFromSource(`2 !== 3`)),
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
					DECORATOR_SOLID.decorate(h.expressionFromSource(`2 != 3`)),
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
					DECORATOR_SOLID.decorate(h.expressionFromSource(`2 !& 3`)),
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
					DECORATOR_SOLID.decorate(h.expressionFromSource(`2 !| 3`)),
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
				const operation: AST.ASTNodeExpression = DECORATOR_SOLID.decorate(h.expressionFromSource(`if true then 2 else 3`));
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
				assert.strictEqual(decl.assignee.id, 256n);
				assert.ok(decl.assigned instanceof AST.ASTNodeTypeOperationBinary);
				assert.strictEqual(decl.assigned.operator, Operator.OR);
				assert.deepStrictEqual(
					[decl.assignee.source, decl.assigned.source],
					[`T`,                  `int | float`],
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
				assert.strictEqual(decl.unfixed, true);
				assert.ok(decl.typenode instanceof AST.ASTNodeTypeOperationBinary);
				assert.ok(decl.assigned instanceof AST.ASTNodeOperationBinary);
				assert.deepStrictEqual(
					[decl.assignee.source, decl.assignee.id, decl.typenode.source, decl.typenode.operator, decl.assigned.source, decl.assigned.operator],
					[`the_answer`,         256n,             `int | float`,        Operator.OR,            `21 * 2`,             Operator.MUL],
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
				assert.strictEqual(decl.unfixed, false);
				assert.ok(decl.typenode instanceof AST.ASTNodeTypeConstant);
				assert.ok(decl.assigned instanceof AST.ASTNodeOperationBinary);
				assert.ok(decl.assigned.operand0 instanceof AST.ASTNodeVariable);
				assert.deepStrictEqual(
					[decl.assignee.source, decl.assignee.id, decl.typenode.source, decl.assigned.source, decl.assigned.operator, decl.assigned.operand0.id],
					[`\`the £ answer\``,   256n,             `int`,                `the_answer * 10`,    Operator.MUL,           257n],
				);
			})
		})

		describe('DeclarationClaim ::= "claim" Assignee ":" Type ";"', () => {
			it('makes a ASTNodeDeclarationClaim node.', () => {
				/*
					<DeclarationClaim>
						<Variable source="my_var"/>
						<TypeOperation source="int | float">...</TypeOperation>
					</DeclarationClaim>
				*/
				[
					`my_var`,
					`my_var.2`,
					`my_var.prop`,
					`my_var.2.prop`,
					`my_var.prop.2`,
				].forEach((assignee, i) => {
					const decl: AST.ASTNodeDeclarationClaim = DECORATOR_SOLID.decorate(h.claimDeclarationFromSource(`
						claim ${ assignee }: int | float;
					`));
					assert.ok(decl.claimed_type instanceof AST.ASTNodeTypeOperation);
					assert.ok(decl.assignee instanceof ((i === 0) ? AST.ASTNodeVariable : AST.ASTNodeAccess));
					return assert.deepStrictEqual(
						[decl.assignee.source,            decl.claimed_type.source],
						[assignee.replaceAll('.', ' . '), `int | float`],
					);
				});
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
					[assn.assignee.source, assn.assigned.source, assn.assigned.operator, assn.assigned.operand0.id],
					[`the_answer`,         `the_answer - 40`,    Operator.ADD,           256n],
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

		context('Block ::= "{" Statement+ "}"', () => {
			it('decorates multiple statements.', () => {
				/*
					<Block>
						<StatementExpression source="42 ;">...</StatementExpression>
						<StatementExpression source="420 ;">...</StatementExpression>
					</Block>
				*/
				const block: AST.ASTNodeBlock = DECORATOR_SOLID.decorate(h.blockFromSource(`{ 42; 420; }`));
				assert_arrayLength(block.children, 2, 'semantic block should have 2 children');
				return assert.deepStrictEqual(block.children.map((stat) => {
					assert.ok(stat instanceof AST.ASTNodeStatementExpression);
					return stat.source;
				}), ['42 ;', '420 ;']);
			});
		});

		context('Goal ::= #x02 Block? #x03', () => {
			it('makes an ASTNodeGoal node containing no block.', () => {
				const goal: AST.ASTNodeGoal = DECORATOR_SOLID.decorate(h.goalFromSource(``));
				return assert.ok(!goal.block, 'semantic goal should not have a block');
			})
			it('makes an ASTNodeGoal containing a block.', () => {
				/*
					<Goal>
						<Block source="{ 42 ; 420 ; }">...</Block>
					</Goal>
				*/
				const goal: AST.ASTNodeGoal = DECORATOR_SOLID.decorate(h.goalFromSource(`{ 42; 420; }`));
				assert.ok(goal.block, 'semantic goal should have a block');
				return assert.strictEqual(goal.block.source, '{ 42 ; 420 ; }');
			})
		})
	})
})
