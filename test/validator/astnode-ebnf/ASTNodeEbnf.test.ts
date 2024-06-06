import * as assert from 'assert';
import {
	PARSER_EBNF as PARSER,
	ASTNODE_EBNF as ASTNODE,
	DECORATOR_EBNF as DECORATOR,
} from '../../../src/index.js';



describe('ASTNodeEbnf', () => {
	describe('ASTNodeNonterminal', () => {
		describe('#expand', () => {
			function testExpand(ebnf: string): string[] {
				return DECORATOR.decorate(PARSER.parse(ebnf))
					.productions[0]
					.nonterminal
					.expand().map((cn) => cn.toString())
				;
			}
			it('if no params, returns the nonterminal name.', () => {
				assert.deepStrictEqual(testExpand(`
					NonTerm ::= TERM;
				`), [
					'NonTerm',
				]);
			});
			it('with param, spilts into several names.', () => {
				assert.deepStrictEqual(testExpand(`
					NonTerm<Param> ::= TERM;
				`), [
					'NonTerm',
					'NonTerm_Param',
				]);
			});
			it('expands combinatorially for multiple params in a set.', () => {
				assert.deepStrictEqual([
					testExpand(`
						NonTerm<Param1, Param2> ::= TERM;
					`),
					testExpand(`
						NonTerm<Param1, Param2, Param3> ::= TERM;
					`),
				], [
					[
						'NonTerm',
						'NonTerm_Param2',
						'NonTerm_Param1',
						'NonTerm_Param1_Param2',
					],
					[
						'NonTerm',
						'NonTerm_Param3',
						'NonTerm_Param2',
						'NonTerm_Param2_Param3',
						'NonTerm_Param1',
						'NonTerm_Param1_Param3',
						'NonTerm_Param1_Param2',
						'NonTerm_Param1_Param2_Param3',
					],
				]);
			});
			it('expands combinatorially for multiple param sets.', () => {
				assert.deepStrictEqual([
					testExpand(`
						NonTerm<Param1><Param2> ::= TERM;
					`),
					testExpand(`
						NonTerm<Param1><Param2><Param3> ::= TERM;
					`),
				], [
					[
						'NonTerm',
						'NonTerm_Param2',
						'NonTerm_Param1',
						'NonTerm_Param1_Param2',
					],
					[
						'NonTerm',
						'NonTerm_Param3',
						'NonTerm_Param2',
						'NonTerm_Param2_Param3',
						'NonTerm_Param1',
						'NonTerm_Param1_Param3',
						'NonTerm_Param1_Param2',
						'NonTerm_Param1_Param2_Param3',
					],
				]);
			});
		});
	});



	describe('ASTNodeProduction', () => {
		describe('#transform', () => {
			it('spilts nonterminal parameters into several productions.', () => {
				const prod: ASTNODE.ASTNodeProduction = DECORATOR.decorate(PARSER.parse(`
					NonTerm<Param> ::= TERM;
				`)).productions[0];
				assert.deepStrictEqual(prod.transform(), [
					{
						name: 'NonTerm$',
						family: true,
						defn: [
							[{term: 'TERM'}],
							[{term: 'TERM'}],
						],
					},
					{
						name: 'NonTerm',
						family: 'NonTerm$',
						defn: [
							[{term: 'TERM'}],
						],
					},
					{
						name: 'NonTerm_Param',
						family: 'NonTerm$',
						defn: [
							[{term: 'TERM'}],
						],
					},
				]);
			});
			it('memoizes same list productions for different params.', () => {
				const prod: ASTNODE.ASTNodeProduction = DECORATOR.decorate(PARSER.parse(`
					NonTerm<Param> ::= TERM+;
				`)).productions[0];
				assert.deepStrictEqual(prod.transform(), [
					{
						name: 'NonTerm$__0__List',
						family: true,
						defn: [
							[                            {term: 'TERM'}],
							[{prod: 'NonTerm__0__List'}, {term: 'TERM'}],
						],
					},
					{
						name: 'NonTerm__0__List',
						family: 'NonTerm$__0__List',
						defn: [
							[                            {term: 'TERM'}],
							[{prod: 'NonTerm__0__List'}, {term: 'TERM'}],
						],
					},
					{
						name: 'NonTerm$',
						family: true,
						defn: [
							[{prod: 'NonTerm__0__List'}],
							[{prod: 'NonTerm__0__List'}],
						],
					},
					{
						name: 'NonTerm',
						family: 'NonTerm$',
						defn: [
							[{prod: 'NonTerm__0__List'}],
						],
					},
					{
						name: 'NonTerm_Param',
						family: 'NonTerm$',
						defn: [
							[{prod: 'NonTerm__0__List'}],
						],
					},
				]);
			});
			it('generates different parameterized list productions for different params.', () => {
				const prod: ASTNODE.ASTNodeProduction = DECORATOR.decorate(PARSER.parse(`
					NonTerm<Param> ::= Ref<?Param>+;
				`)).productions[0];
				assert.deepStrictEqual(prod.transform(), [
					{
						name: 'NonTerm$__0__List',
						family: true,
						defn: [
							[                                  {prod: 'Ref'}],
							[{prod: 'NonTerm__0__List'},       {prod: 'Ref'}],
							[                                  {prod: 'Ref_Param'}],
							[{prod: 'NonTerm_Param__0__List'}, {prod: 'Ref_Param'}],
						],
					},
					{
						name: 'NonTerm__0__List',
						family: 'NonTerm$__0__List',
						defn: [
							[                            {prod: 'Ref'}],
							[{prod: 'NonTerm__0__List'}, {prod: 'Ref'}],
						],
					},
					{
						name: 'NonTerm_Param__0__List',
						family: 'NonTerm$__0__List',
						defn: [
							[                                  {prod: 'Ref_Param'}],
							[{prod: 'NonTerm_Param__0__List'}, {prod: 'Ref_Param'}],
						],
					},
					{
						name: 'NonTerm$',
						family: true,
						defn: [
							[{prod: 'NonTerm__0__List'}],
							[{prod: 'NonTerm_Param__0__List'}],
						],
					},
					{
						name: 'NonTerm',
						family: 'NonTerm$',
						defn: [
							[{prod: 'NonTerm__0__List'}],
						],
					},
					{
						name: 'NonTerm_Param',
						family: 'NonTerm$',
						defn: [
							[{prod: 'NonTerm_Param__0__List'}],
						],
					},
				]);
			});
		});
	});



	describe('ASTNodeGoal', () => {
		describe('#transform', () => {
			specify('SemanticGoal ::= SemanticProduction*;', () => {
				assert.deepStrictEqual(DECORATOR.decorate(PARSER.parse(`
					Unit ::= NUMBER | "(" OPERATOR Unit Unit ")";
					Goal ::= #x02 Unit? #x03;
				`)).transform(), [
					{
						name: 'Unit',
						defn: [
							[{term: 'NUMBER'}],
							['(', {term: 'OPERATOR'}, {prod: 'Unit'}, {prod: 'Unit'}, ')'],
						],
					},
					{
						name: 'Goal',
						defn: [
							['\\u0002',                 '\\u0003'],
							['\\u0002', {prod: 'Unit'}, '\\u0003'],
						],
					},
				]);
			});
		});
	});
});
