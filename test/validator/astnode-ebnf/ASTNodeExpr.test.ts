import * as assert from 'assert';
import {
	EBNFChoice,
	PARSER_EBNF as PARSER,
	DECORATOR_EBNF as DECORATOR,
} from '../../../src/index.js';



function makeProductionDefn(ebnf: string): EBNFChoice {
	return DECORATOR.decorate(PARSER.parse(ebnf)).productions[0].transform()[0].defn;
}



describe('ASTNodeExpr', () => {
	describe('ASTNodeConst', () => {
		describe('#transform', () => {
			it('returns a string for a string.', () => {
				assert.deepStrictEqual(makeProductionDefn(`
					Alpha ::= "omega";
				`), [
					['omega'],
				]);
			});
		});
	});



	describe('ASTNodeRef', () => {
		describe('#transform', () => {
			it('returns a terminal for a MACRO_CASE identifier.', () => {
				assert.deepStrictEqual(makeProductionDefn(`
					Alpha ::= ALPHA;
				`), [
					[{term: 'ALPHA'}],
				]);
			});
			it('returns a production for a TitleCase identifier, no arguments.', () => {
				assert.deepStrictEqual(makeProductionDefn(`
					Beta ::= Bravo;
				`), [
					[{prod: 'Bravo'}],
				]);
			});
			it('appends arguments for a TitleCase identifier, with single argument.', () => {
				assert.deepStrictEqual(makeProductionDefn(`
					Gamma ::=
						. Charlie0<+Cee>
						. Charlie1<-Dee>
					;
				`), [
					[{prod: 'Charlie0_Cee'}, {prod: 'Charlie1'}],
				]);
			});
			it('appends arguments for a TitleCase identifier, with multiple arguments.', () => {
				assert.deepStrictEqual([
					makeProductionDefn(`Delta ::= Delta0<+Eee, +Eff>;`),
					makeProductionDefn(`Delta ::= Delta1<+Eee, -Eff>;`),
					makeProductionDefn(`Delta ::= Delta2<-Eee, +Eff>;`),
					makeProductionDefn(`Delta ::= Delta3<-Eee, -Eff>;`),
				], [
					[
						[{prod: 'Delta0_Eff'}],
						[{prod: 'Delta0_Eee'}],
						[{prod: 'Delta0_Eee_Eff'}],
					],
					[
						[{prod: 'Delta1'}],
						[{prod: 'Delta1_Eee'}],
					],
					[
						[{prod: 'Delta2'}],
						[{prod: 'Delta2_Eff'}],
					],
					[
						[{prod: 'Delta3'}],
					],
				]);
				assert.deepStrictEqual([
					makeProductionDefn(`Epsilon ::= Echo0<+Eee, +Eff, +Gee>;`),
					makeProductionDefn(`Epsilon ::= Echo1<+Eee, +Eff, -Gee>;`),
					makeProductionDefn(`Epsilon ::= Echo2<+Eee, -Eff, +Gee>;`),
					makeProductionDefn(`Epsilon ::= Echo3<+Eee, -Eff, -Gee>;`),
					makeProductionDefn(`Epsilon ::= Echo4<-Eee, +Eff, +Gee>;`),
					makeProductionDefn(`Epsilon ::= Echo5<-Eee, +Eff, -Gee>;`),
					makeProductionDefn(`Epsilon ::= Echo6<-Eee, -Eff, +Gee>;`),
					makeProductionDefn(`Epsilon ::= Echo7<-Eee, -Eff, -Gee>;`),
				], [
					[
						[{prod: 'Echo0_Gee'}],
						[{prod: 'Echo0_Eff'}],
						[{prod: 'Echo0_Eff_Gee'}],
						[{prod: 'Echo0_Eee'}],
						[{prod: 'Echo0_Eee_Gee'}],
						[{prod: 'Echo0_Eee_Eff'}],
						[{prod: 'Echo0_Eee_Eff_Gee'}],
					],
					[
						[{prod: 'Echo1'}],
						[{prod: 'Echo1_Eff'}],
						[{prod: 'Echo1_Eee'}],
						[{prod: 'Echo1_Eee_Eff'}],
					],
					[
						[{prod: 'Echo2'}],
						[{prod: 'Echo2_Gee'}],
						[{prod: 'Echo2_Eee'}],
						[{prod: 'Echo2_Eee_Gee'}],
					],
					[
						[{prod: 'Echo3'}],
						[{prod: 'Echo3_Eee'}],
					],
					[
						[{prod: 'Echo4'}],
						[{prod: 'Echo4_Gee'}],
						[{prod: 'Echo4_Eff'}],
						[{prod: 'Echo4_Eff_Gee'}],
					],
					[
						[{prod: 'Echo5'}],
						[{prod: 'Echo5_Eff'}],
					],
					[
						[{prod: 'Echo6'}],
						[{prod: 'Echo6_Gee'}],
					],
					[
						[{prod: 'Echo7'}],
					],
				]);
			});
			it('appends arguments for a TitleCase identifier, with multiple argument sets.', () => {
				assert.deepStrictEqual([
					makeProductionDefn(`Zeta ::= Foxtrot0<+Ach><+Eye>;`),
					makeProductionDefn(`Zeta ::= Foxtrot1<+Ach><-Eye>;`),
					makeProductionDefn(`Zeta ::= Foxtrot2<-Ach><+Eye>;`),
					makeProductionDefn(`Zeta ::= Foxtrot3<-Ach><-Eye>;`),
				], [
					[
						[{prod: 'Foxtrot0_Ach_Eye'}],
					],
					[
						[{prod: 'Foxtrot1_Ach'}],
					],
					[
						[{prod: 'Foxtrot2_Eye'}],
					],
					[
						[{prod: 'Foxtrot3'}],
					],
				]);
				assert.deepStrictEqual([
					makeProductionDefn(`Eta ::= Golf0<+Jay><+Kay><+Ell>;`),
					makeProductionDefn(`Eta ::= Golf1<+Jay><+Kay><-Ell>;`),
					makeProductionDefn(`Eta ::= Golf2<+Jay><-Kay><+Ell>;`),
					makeProductionDefn(`Eta ::= Golf3<+Jay><-Kay><-Ell>;`),
					makeProductionDefn(`Eta ::= Golf4<-Jay><+Kay><+Ell>;`),
					makeProductionDefn(`Eta ::= Golf5<-Jay><+Kay><-Ell>;`),
					makeProductionDefn(`Eta ::= Golf6<-Jay><-Kay><+Ell>;`),
					makeProductionDefn(`Eta ::= Golf7<-Jay><-Kay><-Ell>;`),
				], [
					[
						[{prod: 'Golf0_Jay_Kay_Ell'}],
					],
					[
						[{prod: 'Golf1_Jay_Kay'}],
					],
					[
						[{prod: 'Golf2_Jay_Ell'}],
					],
					[
						[{prod: 'Golf3_Jay'}],
					],
					[
						[{prod: 'Golf4_Kay_Ell'}],
					],
					[
						[{prod: 'Golf5_Kay'}],
					],
					[
						[{prod: 'Golf6_Ell'}],
					],
					[
						[{prod: 'Golf7'}],
					],
				]);
			});
		});
	});



	describe('ASTNodeItem', () => {
		describe('#transform', () => {
			it('includes the item if one of the conditions is met.', () => {
				assert.deepStrictEqual(DECORATOR.decorate(PARSER.parse(`
					Nonterm<Param> ::= <Param+>TERM "literal";
				`)).transform(), [
					{
						name: 'Nonterm$',
						family: true,
						defn: [
							['literal'],
							[{term: 'TERM'}, 'literal'],
						],
					},
					{
						name: 'Nonterm',
						family: 'Nonterm$',
						defn: [
							['literal'],
						],
					},
					{
						name: 'Nonterm_Param',
						family: 'Nonterm$',
						defn: [
							[{term: 'TERM'}, 'literal'],
						],
					},
				]);
				assert.deepStrictEqual(DECORATOR.decorate(PARSER.parse(`
					Nonterm<Param> ::= <Param+, Par+>TERM "literal";
				`)).transform(), [
					{
						name: 'Nonterm$',
						family: true,
						defn: [
							['literal'],
							[{term: 'TERM'}, 'literal'],
						],
					},
					{
						name: 'Nonterm',
						family: 'Nonterm$',
						defn: [
							['literal'],
						],
					},
					{
						name: 'Nonterm_Param',
						family: 'Nonterm$',
						defn: [
							[{term: 'TERM'}, 'literal'],
						],
					},
				]);
			});
			it('includes the item if nested and all conditions are met.', () => {
				assert.deepStrictEqual(DECORATOR.decorate(PARSER.parse(`
					Nonterm<Param, Par> ::= <Param+><Par+>TERM "literal";
				`)).transform(), [
					{
						name: 'Nonterm$',
						family: true,
						defn: [
							['literal'],
							['literal'],
							['literal'],
							[{term: 'TERM'}, 'literal'],
						],
					},
					{
						name: 'Nonterm',
						family: 'Nonterm$',
						defn: [
							['literal'],
						],
					},
					{
						name: 'Nonterm_Par',
						family: 'Nonterm$',
						defn: [
							['literal'],
						],
					},
					{
						name: 'Nonterm_Param',
						family: 'Nonterm$',
						defn: [
							['literal'],
						],
					},
					{
						name: 'Nonterm_Param_Par',
						family: 'Nonterm$',
						defn: [
							[{term: 'TERM'}, 'literal'],
						],
					},
				]);
			});
			it('does not include the item if all conditions are not met.', () => {
				assert.deepStrictEqual(DECORATOR.decorate(PARSER.parse(`
					Nonterm<Par> ::= <Param+>TERM "literal";
				`)).transform(), [
					{
						name: 'Nonterm$',
						family: true,
						defn: [
							['literal'],
							['literal'],
						],
					},
					{
						name: 'Nonterm',
						family: 'Nonterm$',
						defn: [
							['literal'],
						],
					},
					{
						name: 'Nonterm_Par',
						family: 'Nonterm$',
						defn: [
							['literal'],
						],
					},
				]);
			});
			it('anti-includes the item if negated condition.', () => {
				assert.deepStrictEqual(DECORATOR.decorate(PARSER.parse(`
					Nonterm<Param> ::= <Param->TERM "literal";
				`)).transform(), [
					{
						name: 'Nonterm$',
						family: true,
						defn: [
							[{term: 'TERM'}, 'literal'],
							['literal'],
						],
					},
					{
						name: 'Nonterm',
						family: 'Nonterm$',
						defn: [
							[{term: 'TERM'}, 'literal'],
						],
					},
					{
						name: 'Nonterm_Param',
						family: 'Nonterm$',
						defn: [
							['literal'],
						],
					},
				]);
			});
		});
	});
});
