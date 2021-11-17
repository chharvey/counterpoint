import * as assert from 'assert';
import {
	EBNFChoice,
	PARSER_EBNF as PARSER,
	DECORATOR_EBNF as DECORATOR,
} from '../../../src/index.js';



function makeProductionDefn(ebnf: string): EBNFChoice {
	return DECORATOR.decorate(PARSER.parse(ebnf)).productions[0].transform()[0].defn;
}



describe('ASTNodeOp', () => {
	describe('ASTNodeOpUn[operator=PLUS]', () => {
		describe('#transform', () => {
			it('creates a new production with __0__List appended to the name.', () => {
				assert.deepStrictEqual(DECORATOR.decorate(PARSER.parse(`
					NonTerm ::= ALPHA BETA+ GAMMA;
				`)).productions[0].transform(), [
					{
						name: 'NonTerm__0__List',
						defn: [
							[{term: 'BETA'}],
							[{prod: 'NonTerm__0__List'}, {term: 'BETA'}],
						],
					},
					{
						name: 'NonTerm',
						defn: [
							[{term: 'ALPHA'}, {prod: 'NonTerm__0__List'}, {term: 'GAMMA'}],
						],
					},
				]);
			});
			it('memoizes reusable plus-lists.', () => {
				assert.deepStrictEqual(DECORATOR.decorate(PARSER.parse(`
					Alpha ::= BETA GAMMA+;
					Delta ::= GAMMA+ EPSILON;
				`)).transform(), [
					{
						name: 'Alpha__0__List',
						defn: [
							[                          {term: 'GAMMA'}],
							[{prod: 'Alpha__0__List'}, {term: 'GAMMA'}],
						],
					},
					{
						name: 'Alpha',
						defn: [
							[{term: 'BETA'}, {prod: 'Alpha__0__List'}],
						],
					},
					{
						name: 'Delta',
						defn: [
							[{prod: 'Alpha__0__List'}, {term: 'EPSILON'}],
						],
					},
				]);
			});
		});
	});



	describe('ASTNodeOpUn[operator=HASH]', () => {
		describe('#transform', () => {
			it('creates a new production with __0__List appended to the name.', () => {
				assert.deepStrictEqual(DECORATOR.decorate(PARSER.parse(`
					NonTerm ::= ALPHA BETA# GAMMA;
				`)).productions[0].transform(), [
					{
						name: 'NonTerm__0__List',
						defn: [
							[{term: 'BETA'}],
							[{prod: 'NonTerm__0__List'}, ',', {term: 'BETA'}],
						],
					},
					{
						name: 'NonTerm',
						defn: [
							[{term: 'ALPHA'}, {prod: 'NonTerm__0__List'}, {term: 'GAMMA'}],
						],
					},
				]);
			});
			it('memoizes reusable hash-lists.', () => {
				assert.deepStrictEqual(DECORATOR.decorate(PARSER.parse(`
					Alpha ::= BETA GAMMA#;
					Delta ::= GAMMA# EPSILON;
				`)).transform(), [
					{
						name: 'Alpha__0__List',
						defn: [
							[                               {term: 'GAMMA'}],
							[{prod: 'Alpha__0__List'}, ',', {term: 'GAMMA'}],
						],
					},
					{
						name: 'Alpha',
						defn: [
							[{term: 'BETA'}, {prod: 'Alpha__0__List'}],
						],
					},
					{
						name: 'Delta',
						defn: [
							[{prod: 'Alpha__0__List'}, {term: 'EPSILON'}],
						],
					},
				]);
			});
		});
	});



	describe('ASTNodeOpUn[operator=OPT]', () => {
		specify('#transform', () => {
			assert.deepStrictEqual(DECORATOR.decorate(PARSER.parse(`
				NonTerm ::= ALPHA BETA? GAMMA;
			`)).productions[0].transform(), [
				{
					name: 'NonTerm',
					defn: [
						[{term: 'ALPHA'},                 {term: 'GAMMA'}],
						[{term: 'ALPHA'}, {term: 'BETA'}, {term: 'GAMMA'}],
					],
				},
			]);
		});
	});



	describe('ASTNodeOpBin[operator=ORDER]', () => {
		specify('#transform', () => {
			assert.deepStrictEqual(makeProductionDefn(`
				Nonterm ::= "TERM1" TERM2;
			`), [
				['TERM1', {term: 'TERM2'}],
			]);
		});
	});



	describe('ASTNodeOpBin[operator=CONCAT]', () => {
		specify('#transform', () => {
			assert.deepStrictEqual(makeProductionDefn(`
				Nonterm ::= "TERM1" & TERM2;
			`), [
				['TERM1', {term: 'TERM2'}],
				[{term: 'TERM2'}, 'TERM1'],
			]);
		});
	});



	describe('ASTNodeOpBin[operator=ALTERN]', () => {
		specify('#transform', () => {
			assert.deepStrictEqual(makeProductionDefn(`
				Nonterm ::= "TERM1" | TERM2;
			`), [
				['TERM1'],
				[{term: 'TERM2'}],
			]);
		});
	});
});
