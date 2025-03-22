#!/usr/bin/env node

import * as xjs from 'extrajs';
import * as fs from 'fs';
import * as path from 'path';



function s(name: string, ...operands: readonly string[]): string {
	return xjs.String.dedent`
		(${ name }
			${ operands.join('') }
		)
	`;
}

function source_file(...statements: readonly string[]): string {
	return s('source_file', ...statements);
}

function declaration_type(typ: string): string {
	return s('declaration_type', s('identifier'), typ);
}

function statement_expression(expr: string): string {
	return s('statement_expression', expr);
}

function sourceTypes(...types: readonly string[]): string {
	return source_file(...types.map((typ) => declaration_type(typ)));
}

function sourceExpressions(...expressions: readonly string[]): string {
	return source_file(...expressions.map((expr) => statement_expression(expr)));
}



function buildTest(title: string, source: string, expected: string): string {
	return xjs.String.dedent`
		${ '='.repeat(title.length) }
		${ title }
		${ '='.repeat(title.length) }

		${ source }

		---

		${ expected }
	`;
}



(async (): Promise<void> => {
	const FILEPATH = path.join(import.meta.dirname, './corpus/index.txt');
	await fs.promises.mkdir(path.dirname(FILEPATH), {recursive: true});
	return fs.promises.writeFile(FILEPATH, Object.entries({
		/* # TERMINALS */
		KEYWORD_TYPE: [
			xjs.String.dedent`
				type T = never;
				type T = void;
				type T = bool;
				type T = int;
				type T = float;
				type T = str;
				type T = unknown;
			`,
			sourceTypes(
				s('keyword_type'),
				s('keyword_type'),
				s('keyword_type'),
				s('keyword_type'),
				s('keyword_type'),
				s('keyword_type'),
				s('keyword_type'),
			),
		],

		KEYWORD_VALUE: [
			xjs.String.dedent`
				null;
				false;
				true;
			`,
			sourceExpressions(
				s('primitive_literal', s('keyword_value')),
				s('primitive_literal', s('keyword_value')),
				s('primitive_literal', s('keyword_value')),
			),
		],

		IDENTIFIER: [
			xjs.String.dedent`
				my_variable;
				'my variable';
				Object;
			`,
			sourceExpressions(
				s('identifier'),
				s('identifier'),
				s('identifier'),
			),
		],

		INTEGER: [
			xjs.String.dedent`
				42;
				\\b01000101;
				4_2;
				\\b0100_0101;
			`,
			sourceExpressions(
				s('primitive_literal', s('integer')),
				s('primitive_literal', s('integer__radix')),
				s('primitive_literal', s('integer__separator')),
				s('primitive_literal', s('integer__radix__separator')),
			),
		],

		FLOAT: [
			xjs.String.dedent`
				42.0;
				42.69;
				42.69e15;
				42.69e+15;
				42.69e-15;
				4_2.0;
				4_2.6_9;
				4_2.6_9e1_5;
				4_2.6_9e+1_5;
				4_2.6_9e-1_5;
			`,
			sourceExpressions(
				s('primitive_literal', s('float')),
				s('primitive_literal', s('float')),
				s('primitive_literal', s('float')),
				s('primitive_literal', s('float')),
				s('primitive_literal', s('float')),
				s('primitive_literal', s('float__separator')),
				s('primitive_literal', s('float__separator')),
				s('primitive_literal', s('float__separator')),
				s('primitive_literal', s('float__separator')),
				s('primitive_literal', s('float__separator')),
			),
		],

		STRING: [
			xjs.String.dedent`
				"hello world";

				"hello world %ignore";

				"hello %ignore
				world";

				"hello world %%ignore
				ignore";

				"hello %%ignore
				ignore%% world";

				"hello\\u{0020}world";

				"hello\\u{00_20}world";
			`,
			sourceExpressions(
				s('primitive_literal', s('string')),
				s('primitive_literal', s('string')),
				s('primitive_literal', s('string')),
				s('primitive_literal', s('string')),
				s('primitive_literal', s('string')),
				s('primitive_literal', s('string')),
				s('primitive_literal', s('string__separator')),
			),
		],

		// TEMPLATE_{FULL,HEAD,MIDDLE,TAIL}
		// tested in #StringTemplate



		/* # PRODUCTIONS */
		// Word
		// tested in #{PrimitiveLiteral,EntryType,PropertyAccessType,Property,PropertyAccess,PropertyAssign}

		PrimitiveLiteral: [
			xjs.String.dedent`
				type T = null;
				type T = false;
				type T = true;
				type T = 42;
				type T = 4.2;
				type T = "hello";

				null;
				false;
				true;
				42;
				4.2;
				"hello";
			`,
			(() => {
				const primitive_literals = [
					'keyword_value',
					'keyword_value',
					'keyword_value',
					'integer',
					'float',
					'string',
				].map((n) => s('primitive_literal', s(n)));
				return source_file(
					...primitive_literals.map((pl) => declaration_type    (pl)),
					...primitive_literals.map((pl) => statement_expression(pl)),
				);
			})(),
		],


		/* ## Types */
		// EntryType
		// tested in #Type{Tuple,Record}Literal

		// ItemsType
		// tested in #TypeTupleLiteral

		// PropertiesType
		// tested in #TypeRecordLiteral

		TypeGrouped: [
			xjs.String.dedent`
				type T = (42);
				type T = (int);
				type T = (T);
			`,
			sourceTypes(
				s('type_grouped', s('primitive_literal', s('integer'))),
				s('type_grouped', s('keyword_type')),
				s('type_grouped', s('identifier')),
			),
		],

		TypeTupleLiteral: [
			xjs.String.dedent`
				type T = [bool, int, ?: str];
				type U = [
					V.0,
					W.<float>,
				];
			`,
			sourceTypes(
				s(
					'type_tuple_literal',
					s('entry_type',           s('keyword_type')),
					s('entry_type',           s('keyword_type')),
					s('entry_type__optional', s('keyword_type')),
				),
				s(
					'type_tuple_literal',
					s(
						'entry_type',
						s(
							'type_compound',
							s('identifier'),
							s('property_access_type', s('integer')),
						),
					),
					s(
						'entry_type',
						s(
							'type_compound',
							s('identifier'),
							s(
								'generic_call',
								s('generic_arguments', s('keyword_type')),
							),
						),
					),
				),
			),
		],

		TypeRecordLiteral: [
			xjs.String.dedent`
				type T = [a: bool, b?: int, _: str];
				type U = [
					a: V.0,
					b: W.<float>,
				];
			`,
			sourceTypes(
				s(
					'type_record_literal',
					s('entry_type__named',           s('word', s('identifier')), s('keyword_type')),
					s('entry_type__named__optional', s('word', s('identifier')), s('keyword_type')),
					s('entry_type__named',           s('word'),                  s('keyword_type')),
				),
				s(
					'type_record_literal',
					s(
						'entry_type__named',
						s('word', s('identifier')),
						s(
							'type_compound',
							s('identifier'),
							s('property_access_type', s('integer')),
						),
					),
					s(
						'entry_type__named',
						s('word', s('identifier')),
						s(
							'type_compound',
							s('identifier'),
							s(
								'generic_call',
								s('generic_arguments', s('keyword_type')),
							),
						),
					),
				),
			),
		],

		TypeDictLiteral: [
			xjs.String.dedent`
				type T = [: bool];
			`,
			sourceTypes(s(
				'type_dict_literal',
				s('keyword_type'),
			)),
		],

		TypeMapLiteral: [
			xjs.String.dedent`
				type T = {int -> float};
			`,
			sourceTypes(s(
				'type_map_literal',
				s('keyword_type'),
				s('keyword_type'),
			)),
		],

		// TypeUnit
		// consists of #{KEYWORD_TYPE,IDENTIFIER,PrimitiveLiteral,TypeGrouped,Type{Tuple,Record,Dict,Map}Literal}

		// PropertyAccessType
		// tested in #TypeCompound

		// GenericCall
		// tested in #TypeCompound

		TypeCompound: [
			xjs.String.dedent`
				type T = TupleType.0;
				type T = RecordType.prop;
				type T = RecordType._;
				type T = Set.<T>;
			`,
			sourceTypes(
				s(
					'type_compound',
					s('identifier'),
					s('property_access_type', s('integer')),
				),
				s(
					'type_compound',
					s('identifier'),
					s('property_access_type', s('word', s('identifier'))),
				),
				s(
					'type_compound',
					s('identifier'),
					s('property_access_type', s('word')),
				),
				s(
					'type_compound',
					s('identifier'),
					s(
						'generic_call',
						s('generic_arguments', s('identifier')),
					),
				),
			),
		],

		TypeUnarySymbol: [
			xjs.String.dedent`
				type T = T?;
				type T = T!;
				type T = T[];
				type T = T[3];
				type T = T{};
			`,
			sourceTypes(
				s(
					'type_unary_symbol',
					s('identifier'),
				),
				s(
					'type_unary_symbol',
					s('identifier'),
				),
				s(
					'type_unary_symbol',
					s('identifier'),
				),
				s(
					'type_unary_symbol',
					s('identifier'),
					s('integer'),
				),
				s(
					'type_unary_symbol',
					s('identifier'),
				),
			),
		],

		TypeUnaryKeyword: [
			xjs.String.dedent`
				type T = mut T;
			`,
			sourceTypes(s(
				'type_unary_keyword',
				s('identifier'),
			)),
		],

		TypeIntersection: [
			xjs.String.dedent`
				type T = T & U;
			`,
			sourceTypes(s(
				'type_intersection',
				s('identifier'),
				s('identifier'),
			)),
		],

		TypeUnion: [
			xjs.String.dedent`
				type T = T | U;
			`,
			sourceTypes(s(
				'type_union',
				s('identifier'),
				s('identifier'),
			)),
		],

		// Type
		// consists of #TypeUnion


		/* ## Expressions */
		StringTemplate: [
			xjs.String.dedent`
				"""hello {{ to }} the
				the {{ big }} world""";

				"""hello {{ to }} the {{ whole }} great {{ big }} world""";

				"""hello {{ """to {{ """the
				the""" }} big""" }} world""";
			`,
			sourceExpressions(
				s(
					'string_template',
					s('template_head'),
					s('identifier'),
					s('template_middle'),
					s('identifier'),
					s('template_tail'),
				),
				s(
					'string_template',
					s('template_head'),
					s('identifier'),
					s('template_middle'),
					s('identifier'),
					s('template_middle'),
					s('identifier'),
					s('template_tail'),
				),
				s(
					'string_template',
					s('template_head'),
					s(
						'string_template',
						s('template_head'),
						s(
							'string_template',
							s('template_full'),
						),
						s('template_tail'),
					),
					s('template_tail'),
				),
			),
		],

		// Property
		// tested in #RecordLiteral

		// Case
		// tested in #MapLiteral

		ExpressionGrouped: [
			xjs.String.dedent`
				(42);
				(a);
			`,
			sourceExpressions(
				s('expression_grouped', s('primitive_literal', s('integer'))),
				s('expression_grouped', s('identifier')),
			),
		],

		TupleLiteral: [
			xjs.String.dedent`
				[1, [2], [[3]]];
			`,
			sourceExpressions(s(
				'tuple_literal',
				/* eslint-disable @stylistic/indent */
				                                      s('primitive_literal', s('integer')),
				                   s('tuple_literal', s('primitive_literal', s('integer'))),
				s('tuple_literal', s('tuple_literal', s('primitive_literal', s('integer')))),
				/* eslint-enable @stylistic/indent */
			)),
		],

		RecordLiteral: [
			xjs.String.dedent`
				[a= 1, b= [x= 2], _= [y= [k= 3]]];
			`,
			sourceExpressions(s(
				'record_literal',
				s(
					'property',
					s('word', s('identifier')),
					s('primitive_literal', s('integer')),
				),
				s(
					'property',
					s('word', s('identifier')),
					s(
						'record_literal',
						s(
							'property',
							s('word', s('identifier')),
							s('primitive_literal', s('integer')),
						),
					),
				),
				s(
					'property',
					s('word'),
					s(
						'record_literal',
						s(
							'property',
							s('word', s('identifier')),
							s(
								'record_literal',
								s(
									'property',
									s('word', s('identifier')),
									s('primitive_literal', s('integer')),
								),
							),
						),
					),
				),
			)),
		],

		SetLiteral: [
			xjs.String.dedent`
				{1, 2, 3};
			`,
			sourceExpressions(s(
				'set_literal',
				s('primitive_literal', s('integer')),
				s('primitive_literal', s('integer')),
				s('primitive_literal', s('integer')),
			)),
		],

		MapLiteral: [
			xjs.String.dedent`
				{"1" -> 1, "2" -> 2, "3" -> 3};
			`,
			sourceExpressions(s(
				'map_literal',
				s(
					'case',
					s('primitive_literal', s('string')),
					s('primitive_literal', s('integer')),
				),
				s(
					'case',
					s('primitive_literal', s('string')),
					s('primitive_literal', s('integer')),
				),
				s(
					'case',
					s('primitive_literal', s('string')),
					s('primitive_literal', s('integer')),
				),
			)),
		],

		// FunctionArguments
		// tested in #FunctionCall

		// ExpressionUnit
		// consists of #{IDENTIFIER,PrimitiveLiteral,StringTemplate,ExpressionGrouped,{Tuple,Record,Set,Map}Literal}

		// PropertyAccess
		// tested in #ExpressionCompound

		// PropertyAssign
		// tested in #Assignee

		// FunctionCall
		// tested in #ExpressionCompound

		ExpressionCompound: [
			xjs.String.dedent`
				tuple.0;
				tuple?.0;
				tuple!.0;
				record.prop;
				record?.prop;
				record!.prop;
				record._;
				list.[index];
				list?.[index];
				list!.[index];
				List.();
				Dict.([]);
				Set.<T>();
			`,
			sourceExpressions(
				s(
					'expression_compound',
					s('identifier'),
					s('property_access', s('integer')),
				),
				s(
					'expression_compound',
					s('identifier'),
					s('property_access', s('integer')),
				),
				s(
					'expression_compound',
					s('identifier'),
					s('property_access', s('integer')),
				),
				s(
					'expression_compound',
					s('identifier'),
					s('property_access', s('word', s('identifier'))),
				),
				s(
					'expression_compound',
					s('identifier'),
					s('property_access', s('word', s('identifier'))),
				),
				s(
					'expression_compound',
					s('identifier'),
					s('property_access', s('word', s('identifier'))),
				),
				s(
					'expression_compound',
					s('identifier'),
					s('property_access', s('word')),
				),
				s(
					'expression_compound',
					s('identifier'),
					s('property_access', s('identifier')),
				),
				s(
					'expression_compound',
					s('identifier'),
					s('property_access', s('identifier')),
				),
				s(
					'expression_compound',
					s('identifier'),
					s('property_access', s('identifier')),
				),
				s(
					'expression_compound',
					s('identifier'),
					s('function_call', s('function_arguments')),
				),
				s(
					'expression_compound',
					s('identifier'),
					s(
						'function_call',
						s(
							'function_arguments',
							s('tuple_literal'),
						),
					),
				),
				s(
					'expression_compound',
					s('identifier'),
					s(
						'function_call',
						s(
							'generic_arguments',
							s('identifier'),
						),
						s('function_arguments'),
					),
				),
			),
		],

		// Assignee
		// tested in #StatementAssignment

		ExpressionUnarySymbol: [
			xjs.String.dedent`
				!value;
				?value;
				+value;
				-value;
			`,
			sourceExpressions(
				s(
					'expression_unary_symbol',
					s('identifier'),
				),
				s(
					'expression_unary_symbol',
					s('identifier'),
				),
				s(
					'expression_unary_symbol',
					s('identifier'),
				),
				s(
					'expression_unary_symbol',
					s('identifier'),
				),
			),
		],

		ExpressionExponential: [
			xjs.String.dedent`
				a ^ b;
				a ^ b ^ c;
			`,
			sourceExpressions(
				s(
					'expression_exponential',
					s('identifier'),
					s('identifier'),
				),
				s(
					'expression_exponential',
					s('identifier'),
					s(
						'expression_exponential',
						s('identifier'),
						s('identifier'),
					),
				),
			),
		],

		ExpressionMultiplicative: [
			xjs.String.dedent`
				a * b;
				a / b;
				a * b * c;
			`,
			sourceExpressions(
				s(
					'expression_multiplicative',
					s('identifier'),
					s('identifier'),
				),
				s(
					'expression_multiplicative',
					s('identifier'),
					s('identifier'),
				),
				s(
					'expression_multiplicative',
					s(
						'expression_multiplicative',
						s('identifier'),
						s('identifier'),
					),
					s('identifier'),
				),
			),
		],

		ExpressionAdditive: [
			xjs.String.dedent`
				a + b;
				a - b;
			`,
			sourceExpressions(
				s(
					'expression_additive',
					s('identifier'),
					s('identifier'),
				),
				s(
					'expression_additive',
					s('identifier'),
					s('identifier'),
				),
			),
		],

		ExpressionComparative: [
			xjs.String.dedent`
				a < b;
				a > b;
				a <= b;
				a >= b;
				a !< b;
				a !> b;
				a is b;
				a isnt b;
			`,
			sourceExpressions(
				s(
					'expression_comparative',
					s('identifier'),
					s('identifier'),
				),
				s(
					'expression_comparative',
					s('identifier'),
					s('identifier'),
				),
				s(
					'expression_comparative',
					s('identifier'),
					s('identifier'),
				),
				s(
					'expression_comparative',
					s('identifier'),
					s('identifier'),
				),
				s(
					'expression_comparative',
					s('identifier'),
					s('identifier'),
				),
				s(
					'expression_comparative',
					s('identifier'),
					s('identifier'),
				),
				s(
					'expression_comparative',
					s('identifier'),
					s('identifier'),
				),
				s(
					'expression_comparative',
					s('identifier'),
					s('identifier'),
				),
			),
		],

		ExpressionEquality: [
			xjs.String.dedent`
				a === b;
				a !== b;
				a == b;
				a != b;
			`,
			sourceExpressions(
				s(
					'expression_equality',
					s('identifier'),
					s('identifier'),
				),
				s(
					'expression_equality',
					s('identifier'),
					s('identifier'),
				),
				s(
					'expression_equality',
					s('identifier'),
					s('identifier'),
				),
				s(
					'expression_equality',
					s('identifier'),
					s('identifier'),
				),
			),
		],

		ExpressionConjunctive: [
			xjs.String.dedent`
				a && b;
				a !& b;
			`,
			sourceExpressions(
				s(
					'expression_conjunctive',
					s('identifier'),
					s('identifier'),
				),
				s(
					'expression_conjunctive',
					s('identifier'),
					s('identifier'),
				),
			),
		],

		ExpressionDisjunctive: [
			xjs.String.dedent`
				a || b;
				a !| b;
			`,
			sourceExpressions(
				s(
					'expression_disjunctive',
					s('identifier'),
					s('identifier'),
				),
				s(
					'expression_disjunctive',
					s('identifier'),
					s('identifier'),
				),
			),
		],

		ExpressionConditional: [
			xjs.String.dedent`
				if a then b else c;
			`,
			sourceExpressions(s(
				'expression_conditional',
				s('identifier'),
				s('identifier'),
				s('identifier'),
			)),
		],

		// Expression
		// consists of #Expression{Disjunctive,Conditional}


		/* ## Statements */
		DeclarationType: [
			xjs.String.dedent`
				type T = A | B & C;
				type 'Ü' = T;
				type _ = D;
			`,
			s(
				'source_file',
				s(
					'declaration_type',
					s('identifier'),
					s(
						'type_union',
						s('identifier'),
						s(
							'type_intersection',
							s('identifier'),
							s('identifier'),
						),
					),
				),
				s(
					'declaration_type',
					s('identifier'),
					s('identifier'),
				),
				s(
					'declaration_type',
					s('identifier'),
				),
			),
		],

		DeclarationVariable: [
			xjs.String.dedent`
				let v: T = a + b * c;
				let var u: A | B & C = v;
				let 'å': A = a;
				let var 'é': E = e;
				let _: T = v;
			`,
			s(
				'source_file',
				s(
					'declaration_variable',
					s('identifier'),
					s('identifier'),
					s(
						'expression_additive',
						s('identifier'),
						s(
							'expression_multiplicative',
							s('identifier'),
							s('identifier'),
						),
					),
				),
				s(
					'declaration_variable',
					s('identifier'),
					s(
						'type_union',
						s('identifier'),
						s(
							'type_intersection',
							s('identifier'),
							s('identifier'),
						),
					),
					s('identifier'),
				),
				s(
					'declaration_variable',
					s('identifier'),
					s('identifier'),
					s('identifier'),
				),
				s(
					'declaration_variable',
					s('identifier'),
					s('identifier'),
					s('identifier'),
				),
				s(
					'declaration_variable',
					s('identifier'),
					s('identifier'),
				),
			),
		],

		// Declaration
		// consists of #Declaration{Type,Variable}

		StatementExpression: [
			xjs.String.dedent`
				my_var;
			`,
			s('source_file', s('statement_expression', s('identifier'))),
		],

		StatementAssignment: [
			xjs.String.dedent`
				my_var       = a;
				tuple.1      = b;
				record.prop  = c;
				record._     = c;
				list.[index] = d;
			`,
			s(
				'source_file',
				s(
					'statement_assignment',
					s(
						'assignee',
						s('identifier'),
					),
					s('identifier'),
				),
				s(
					'statement_assignment',
					s(
						'assignee',
						s('identifier'),
						s('property_assign', s('integer')),
					),
					s('identifier'),
				),
				s(
					'statement_assignment',
					s(
						'assignee',
						s('identifier'),
						s('property_assign', s('word', s('identifier'))),
					),
					s('identifier'),
				),
				s(
					'statement_assignment',
					s(
						'assignee',
						s('identifier'),
						s('property_assign', s('word')),
					),
					s('identifier'),
				),
				s(
					'statement_assignment',
					s(
						'assignee',
						s('identifier'),
						s('property_assign', s('identifier')),
					),
					s('identifier'),
				),
			),
		],

		// Statement
		// consists of #{Declaration,Statement{Expression,Assignment}}
	})
		.map(([title, [source, expected]]) => buildTest(title, source, expected))
		.filter((test) => !!test)
		.join(''));
})().catch((err) => {
	console.error(err);
	process.exit(1);
});
