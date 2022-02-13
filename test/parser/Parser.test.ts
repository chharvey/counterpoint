import * as assert from 'assert'
import * as xjs from 'extrajs';
import {
	Filebound,
	Token,
	TokenFilebound,
	ParseNode,
	PARSENODE_EBNF,
	PARSER_EBNF,
} from '../../src/index.js';
import {Parser} from '../../src/parser/Parser.js';
import {
	assert_arrayLength,
} from '../assert-helpers.js';



describe('Parser', () => {
	describe('.fromJSON', () => {
		it('returns a string representing a new subclass of Parser.', () => {
			assert.strictEqual(Parser.fromJSON(JSON.parse(`
				[
					{
						"name": "Unit",
						"defn": [
							[{"term":"NUMBER"}],
							["(", {"term":"OPERATOR"}, {"prod":"Unit"}, {"prod":"Unit"}, ")"]
						]
					},
					{
						"name": "Goal",
						"defn": [
							["\\u0002", "\\u0003"],
							["\\u0002", {"prod":"Unit"}, "\\u0003"]
						]
					}
				]
			`)), (xjs.String.dedent`
				export const PARSER: Parser<ParseNodeGoal> = new Parser<ParseNodeGoal>(
					LEXER,
					GRAMMAR,
					new Map<Production, typeof ParseNode>([
						[ProductionUnit.instance, ParseNodeUnit],
						[ProductionGoal.instance, ParseNodeGoal],
					]),
				);
			`));
		});
	});
});



describe('ParserEbnf', () => {
	describe('#parse', () => {
		specify('Goal ::= #x02 Production* #x03;', () => {
			const goal: ParseNode = PARSER_EBNF.parse(`
				Unit ::= NUMBER | "(" OPERATOR Unit Unit ")";
				Goal ::= #x02 Unit? #x03;
			`);
			/*
				<Goal>
					<FILEBOUND>␂</FILEBOUND>
					<Goal__0__List>
						<Goal__0__List>
							<Production source='Unit ::= NUMBER | "(" OPERATOR Unit Unit ")" ;'>...</Production>
						</Goal__0__List>
						<Production source='Goal ::= #x02 Unit ? #x03 ;'>...</Production>
					</Goal__0__List>
					<FILEBOUND>␃</FILEBOUND>
				</Goal>
			*/
			assert.ok(goal instanceof PARSENODE_EBNF.ParseNodeGoal);
			assert_arrayLength(goal.children, 3, 'goal should have 3 children');
			const [sot, prod_list, eot]: readonly [Token, PARSENODE_EBNF.ParseNodeGoal__0__List, Token] = goal.children;
			assert.ok(sot instanceof TokenFilebound);
			assert.ok(eot instanceof TokenFilebound);
			assert.deepStrictEqual(
				[sot.source,    eot.source],
				[Filebound.SOT, Filebound.EOT],
			);
			assert_arrayLength(prod_list.children, 2, 'outer production list should have 2 children');
			const [first, second]: readonly [PARSENODE_EBNF.ParseNodeGoal__0__List, PARSENODE_EBNF.ParseNodeProduction] = prod_list.children;
			assert_arrayLength(first.children, 1, 'inner production list should have 1 child');
			const prod: PARSENODE_EBNF.ParseNodeProduction = first.children[0];
			assert.deepStrictEqual(
				[prod.source,                                      second.source],
				[`Unit ::= NUMBER | "(" OPERATOR Unit Unit ")" ;`, `Goal ::= #x02 Unit ? #x03 ;`],
			);
		});

		specify('Production ::= NonterminalName "::=" Definition ";";', () => {
			const prod: PARSENODE_EBNF.ParseNodeProduction = (PARSER_EBNF.parse(`
				Unit ::=
					| NUMBER
					| "(" OPERATOR Unit Unit ")"
				;
			`)
				.children[1] as PARSENODE_EBNF.ParseNodeGoal__0__List)
				.children[0] as PARSENODE_EBNF.ParseNodeProduction
			;
			/*
				<Production>
					<NonterminalName source="Unit">...<NonterminalName>
					<PUNCTUATOR>::=<PUNCTUATOR>
					<Definition source='| NUMBER | "(" OPERATOR Unit Unit ")"'>...<Definition>
					<PUNCTUATOR>;<PUNCTUATOR>
				</Production>
			*/
			assert_arrayLength(prod.children, 4, 'production should have 4 children');
			const children: readonly [PARSENODE_EBNF.ParseNodeNonterminalName, Token, PARSENODE_EBNF.ParseNodeDefinition, Token] = prod.children;
			assert.deepStrictEqual(
				children.map((c) => c.source),
				['Unit', '::=', '| NUMBER | "(" OPERATOR Unit Unit ")"', ';'],
			);
		});

		specify('Definition ::= "." Altern;', () => {
			const defn: PARSENODE_EBNF.ParseNodeDefinition = ((PARSER_EBNF.parse(`
				Unit ::=
					. NUMBER | "(" OPERATOR Unit Unit ")"
				;
			`)
				.children[1] as PARSENODE_EBNF.ParseNodeGoal__0__List)
				.children[0] as PARSENODE_EBNF.ParseNodeProduction)
				.children[2] as PARSENODE_EBNF.ParseNodeDefinition
			;
			/*
				<Definition>
					<PUNCTUATOR>.<PUNCTUATOR>
					<Altern source='NUMBER | "(" OPERATOR Unit Unit ")"'>...</Altern>
				</Definition>
			*/
			assert_arrayLength(defn.children, 2, 'defn should have 2 children');
			const children: readonly [Token, PARSENODE_EBNF.ParseNodeAltern] | readonly [PARSENODE_EBNF.ParseNodeAltern, Token] = defn.children;
			assert.ok(children[0] instanceof Token);
			assert.ok(children[1] instanceof PARSENODE_EBNF.ParseNodeAltern);
			assert.deepStrictEqual(
				children.map((c) => c.source),
				['.', 'NUMBER | "(" OPERATOR Unit Unit ")"'],
			);
		});

		specify('Definition ::= "&" Altern;', () => {
			const defn: PARSENODE_EBNF.ParseNodeDefinition = ((PARSER_EBNF.parse(`
				Unit ::=
					& NUMBER | "(" OPERATOR Unit Unit ")"
				;
			`)
				.children[1] as PARSENODE_EBNF.ParseNodeGoal__0__List)
				.children[0] as PARSENODE_EBNF.ParseNodeProduction)
				.children[2] as PARSENODE_EBNF.ParseNodeDefinition
			;
			/*
				<Definition>
					<PUNCTUATOR>&<PUNCTUATOR>
					<Altern source='NUMBER | "(" OPERATOR Unit Unit ")"'>...</Altern>
				</Definition>
			*/
			assert_arrayLength(defn.children, 2, 'defn should have 2 children');
			const children: readonly [Token, PARSENODE_EBNF.ParseNodeAltern] | readonly [PARSENODE_EBNF.ParseNodeAltern, Token] = defn.children;
			assert.ok(children[0] instanceof Token);
			assert.ok(children[1] instanceof PARSENODE_EBNF.ParseNodeAltern);
			assert.deepStrictEqual(
				children.map((c) => c.source),
				['&', 'NUMBER | "(" OPERATOR Unit Unit ")"'],
			);
		});

		specify('Definition ::= "|" Altern;', () => {
			const defn: PARSENODE_EBNF.ParseNodeDefinition = ((PARSER_EBNF.parse(`
				Unit ::=
					| NUMBER
					| "(" OPERATOR Unit Unit ")"
				;
			`)
				.children[1] as PARSENODE_EBNF.ParseNodeGoal__0__List)
				.children[0] as PARSENODE_EBNF.ParseNodeProduction)
				.children[2] as PARSENODE_EBNF.ParseNodeDefinition
			;
			/*
				<Definition>
					<PUNCTUATOR>|<PUNCTUATOR>
					<Altern source='NUMBER | "(" OPERATOR Unit Unit ")"'>...</Altern>
				</Definition>
			*/
			assert_arrayLength(defn.children, 2, 'defn should have 2 children');
			const children: readonly [Token, PARSENODE_EBNF.ParseNodeAltern] | readonly [PARSENODE_EBNF.ParseNodeAltern, Token] = defn.children;
			assert.ok(children[0] instanceof Token);
			assert.ok(children[1] instanceof PARSENODE_EBNF.ParseNodeAltern);
			assert.deepStrictEqual(
				children.map((c) => c.source),
				['|', 'NUMBER | "(" OPERATOR Unit Unit ")"'],
			);
		});

		specify('Altern ::= Altern "|" Concat;', () => {
			const altern: PARSENODE_EBNF.ParseNodeAltern = (((PARSER_EBNF.parse(`
				Unit ::=
					| NUMBER
					| "(" OPERATOR Unit Unit ")"
				;
			`)
				.children[1] as PARSENODE_EBNF.ParseNodeGoal__0__List)
				.children[0] as PARSENODE_EBNF.ParseNodeProduction)
				.children[2] as PARSENODE_EBNF.ParseNodeDefinition)
				.children[1] as PARSENODE_EBNF.ParseNodeAltern
			;
			/*
				<Altern>
					<Altern source="NUMBER">...<Altern>
					<PUNCTUATOR>|<PUNCTUATOR>
					<Concat source='"(" OPERATOR Unit Unit ")"'>...<Concat>
				</Altern>
			*/
			assert_arrayLength(altern.children, 3, 'altern should have 3 children');
			const children: readonly [PARSENODE_EBNF.ParseNodeAltern, Token, PARSENODE_EBNF.ParseNodeConcat] = altern.children;
			assert.deepStrictEqual(
				children.map((c) => c.source),
				['NUMBER', '|', '"(" OPERATOR Unit Unit ")"'],
			);
		});

		specify('Concat ::= Concat "&" Order;', () => {
			const concat: PARSENODE_EBNF.ParseNodeConcat = ((((PARSER_EBNF.parse(`
				Unit ::=
					| NUMBER
					| NULL & "(" OPERATOR Unit Unit ")"
				;
			`)
				.children[1] as PARSENODE_EBNF.ParseNodeGoal__0__List)
				.children[0] as PARSENODE_EBNF.ParseNodeProduction)
				.children[2] as PARSENODE_EBNF.ParseNodeDefinition)
				.children[1] as PARSENODE_EBNF.ParseNodeAltern)
				.children[2] as PARSENODE_EBNF.ParseNodeConcat
			;
			/*
				<Concat>
					<Concat source="NULL">...<Concat>
					<PUNCTUATOR>&<PUNCTUATOR>
					<Order source='"(" OPERATOR Unit Unit ")"'>...<Order>
				</Concat>
			*/
			assert_arrayLength(concat.children, 3, 'concat should have 3 children');
			const children: readonly [PARSENODE_EBNF.ParseNodeConcat, Token, PARSENODE_EBNF.ParseNodeOrder] = concat.children;
			assert.deepStrictEqual(
				children.map((c) => c.source),
				['NULL', '&', '"(" OPERATOR Unit Unit ")"'],
			);
		});

		specify('Order ::= Order Item;', () => {
			const order: PARSENODE_EBNF.ParseNodeOrder = (((((PARSER_EBNF.parse(`
				Unit ::=
					| NUMBER
					| "(" OPERATOR Unit Unit ")"
				;
			`)
				.children[1] as PARSENODE_EBNF.ParseNodeGoal__0__List)
				.children[0] as PARSENODE_EBNF.ParseNodeProduction)
				.children[2] as PARSENODE_EBNF.ParseNodeDefinition)
				.children[1] as PARSENODE_EBNF.ParseNodeAltern)
				.children[2] as PARSENODE_EBNF.ParseNodeConcat)
				.children[0] as PARSENODE_EBNF.ParseNodeOrder
			;
			/*
				<Order>
					<Order source='"(" OPERATOR Unit Unit'>...<Order>
					<Item source='")"'>...<Item>
				</Order>
			*/
			assert_arrayLength(order.children, 2, 'order should have 2 children');
			const children: readonly [PARSENODE_EBNF.ParseNodeOrder, PARSENODE_EBNF.ParseNodeItem] = order.children;
			assert.deepStrictEqual(
				children.map((c) => c.source),
				['"(" OPERATOR Unit Unit', '")"'],
			);
		});
	});
});
