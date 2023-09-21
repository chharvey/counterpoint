#!/usr/bin/env node

import * as xjs from 'extrajs';
import * as fs from 'fs';
import * as path from 'path';



function s(name: string, ...operands: readonly string[]): string {
	return xjs.String.dedent`
		(${ name }
			${ operands.join('\n\t') }
		)
	`;
}

function sourceStatements(...statements: readonly string[]): string {
	return s(
		'source_file',
		s(
			'block',
			statements.join(''),
		),
	);
}

function sourceTypes(...types: readonly string[]): string {
	return sourceStatements(...types.map((typ) => s('declaration_type', s('identifier'), typ)));
}

function sourceExpressions(...expressions: string[]): string {
	return sourceStatements(...expressions.map((expr) => s('statement_expression', expr)));
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
	const __dirname = path.dirname(new URL(import.meta.url).pathname);
	const FILEPATH = path.join(__dirname, './corpus/index.txt');
	await fs.promises.mkdir(path.dirname(FILEPATH), {recursive: true});
	return fs.promises.writeFile(FILEPATH, Object.entries({
		/* # TERMINALS */
		KEYWORDTYPE: [
			xjs.String.dedent`
				{
					type T = never;
					type T = void;
					type T = bool;
					type T = int;
					type T = float;
					type T = str;
					type T = unknown;
				}
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

		KEYWORDVALUE: [
			xjs.String.dedent`
				{
					null;
					false;
					true;
				}
			`,
			sourceExpressions(
				s('primitive_literal', s('keyword_value')),
				s('primitive_literal', s('keyword_value')),
				s('primitive_literal', s('keyword_value')),
			),
		],

		IDENTIFIER: [
			xjs.String.dedent`
				{
					my_variable;
					'my variable';
					Object;
				}
			`,
			sourceExpressions(
				s('identifier'),
				s('identifier'),
				s('identifier'),
			),
		],

		INTEGER: [
			xjs.String.dedent`
				{
					42;
					\\b01000101;
					4_2;
					\\b0100_0101;
				}
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
				{
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
				}
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
				{
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
				}
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

		TEMPLATE: [
			xjs.String.dedent`
				{
					"""hello {{ to }} the
					the {{ big }} world""";

					"""hello {{ to }} the {{ whole }} great {{ big }} world""";

					"""hello {{ """to {{ """the
					the""" }} big""" }} world""";
				}
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



		/* # PRODUCTIONS */
		// Word
		// see #{KEYWORDTYPE,KEYWORDVALUE,IDENTIFIER}

		// PrimitiveLiteral
		// see #{KEYWORDVALUE,INTEGER,FLOAT,STRING}


		/* ## Types */
		// EntryType
		// see #Type{Tuple,Record}Literal

		// ItemsType
		// see #TypeTupleLiteral

		// PropertiesType
		// see #TypeRecordLiteral

		TypeGrouped: [
			xjs.String.dedent`
				{
					type T = (42);
					type T = (int);
					type T = (T);
				}
			`,
			sourceTypes(
				s('type_grouped', s('primitive_literal', s('integer'))),
				s('type_grouped', s('keyword_type')),
				s('type_grouped', s('identifier')),
			),
		],

		TypeTupleLiteral: [
			xjs.String.dedent`
				{
					type T = [bool, int, ?: str];
					type U = [
						V.0,
						W.<float>,
					];
				}
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
				{
					type T = [a: bool, b?: int, c: str];
					type U = [
						a: V.0,
						b: W.<float>,
					];
				}
			`,
			sourceTypes(
				s(
					'type_record_literal',
					s('entry_type__named',           s('word', s('identifier')), s('keyword_type')),
					s('entry_type__named__optional', s('word', s('identifier')), s('keyword_type')),
					s('entry_type__named',           s('word', s('identifier')), s('keyword_type')),
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
				{
					type T = [: bool];
				}
			`,
			sourceTypes(s(
				'type_dict_literal',
				s('keyword_type'),
			)),
		],

		TypeMapLiteral: [
			xjs.String.dedent`
				{
					type T = {int -> float};
				}
			`,
			sourceTypes(s(
				'type_map_literal',
				s('keyword_type'),
				s('keyword_type'),
			)),
		],

		// TypeUnit
		// see #KEYWORDTYPE,IDENTIFIER,PrimitiveLiteral,Type{Grouped,{Tuple,Record,Dict,Map}Literal}

		// PropertyAccessType
		// see #TypeCompound

		// GenericCall
		// see #TypeCompound

		TypeCompound: [
			xjs.String.dedent`
				{
					type T = TupleType.0;
					type T = RecordType.prop;
					type T = Set.<T>;
				}
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
					s(
						'generic_call',
						s('generic_arguments', s('identifier')),
					),
				),
			),
		],

		TypeUnarySymbol: [
			xjs.String.dedent`
				{
					type T = T?;
					type T = T!;
					type T = T[];
					type T = T[3];
					type T = T{};
				}
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
				{
					type T = mutable T;
				}
			`,
			sourceTypes(s(
				'type_unary_keyword',
				s('identifier'),
			)),
		],

		TypeIntersection: [
			xjs.String.dedent`
				{
					type T = T & U;
				}
			`,
			sourceTypes(s(
				'type_intersection',
				s('identifier'),
				s('identifier'),
			)),
		],

		TypeUnion: [
			xjs.String.dedent`
				{
					type T = T | U;
				}
			`,
			sourceTypes(s(
				'type_union',
				s('identifier'),
				s('identifier'),
			)),
		],

		// Type
		// see #TypeUnion


		/* ## Expressions */
		// StringTemplate
		// see #TEMPLATE

		// Property
		// see #RecordLiteral

		// Case
		// see #MapLiteral

		ExpressionGrouped: [
			xjs.String.dedent`
				{
					(42);
					(a);
				}
			`,
			sourceExpressions(
				s('expression_grouped', s('primitive_literal', s('integer'))),
				s('expression_grouped', s('identifier')),
			),
		],

		TupleLiteral: [
			xjs.String.dedent`
				{
					[1, [2], [[3]]];
				}
			`,
			sourceExpressions(s(
				'tuple_literal',
				                                      s('primitive_literal', s('integer')),
				                   s('tuple_literal', s('primitive_literal', s('integer'))),
				s('tuple_literal', s('tuple_literal', s('primitive_literal', s('integer')))),
			)),
		],

		RecordLiteral: [
			xjs.String.dedent`
				{
					[a= 1, b= [x= 2], c= [y= [k= 3]]];
				}
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
					s('word', s('identifier')),
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
				{
					{1, 2, 3};
				}
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
				{
					{"1" -> 1, "2" -> 2, "3" -> 3};
				}
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
		// see #FunctionCall

		// ExpressionUnit
		// see #IDENTIFIER,PrimitiveLiteral,StringTemplate,ExpressionGrouped,{Tuple,Record,Set,Map}Literal

		// PropertyAccess
		// see #ExpressionCompound

		// PropertyAssign
		// see #Assignee

		// FunctionCall
		// see #ExpressionCompound

		ExpressionCompound: [
			xjs.String.dedent`
				{
					tuple.0;
					tuple?.0;
					tuple!.0;
					record.prop;
					record?.prop;
					record!.prop;
					list.[index];
					list?.[index];
					list!.[index];
					List.();
					Dict.([]);
					Set.<T>();
				}
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
		// see #DeclarationReassignment

		ExpressionUnarySymbol: [
			xjs.String.dedent`
				{
					!value;
					?value;
					+value;
					-value;
				}
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

		ExpressionClaim: [
			xjs.String.dedent`
				{
					<T>value;
				}
			`,
			sourceExpressions(s(
				'expression_claim',
				s('identifier'),
				s('identifier'),
			)),
		],

		ExpressionExponential: [
			xjs.String.dedent`
				{
					a ^ b;
					a ^ b ^ c;
				}
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
				{
					a * b;
					a / b;
					a * b * c;
				}
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
				{
					a + b;
					a - b;
				}
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
				{
					a < b;
					a > b;
					a <= b;
					a >= b;
					a !< b;
					a !> b;
					a is b;
					a isnt b;
				}
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
				{
					a === b;
					a !== b;
					a == b;
					a != b;
				}
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
				{
					a && b;
					a !& b;
				}
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
				{
					a || b;
					a !| b;
				}
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
				{
					if a then b else c;
				}
			`,
			sourceExpressions(s(
				'expression_conditional',
				s('identifier'),
				s('identifier'),
				s('identifier'),
			)),
		],

		// Expression
		// see #Expression{Disjunctive,Conditional}


		/* ## Statements */
		StatementExpression: [
			xjs.String.dedent`
				{
					my_var;
				}
			`,
			sourceStatements(s('statement_expression', s('identifier'))),
		],

		// Statement
		// see #{Declaration,StatementExpression}

		Block: [
			xjs.String.dedent`
				{
					type T = U;
					let a: T = b;
					claim a: U;
					set a = b;
					a;
				}
			`,
			sourceStatements(
				s(
					'declaration_type',
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
					'declaration_claim',
					s(
						'assignee',
						s('identifier'),
					),
					s('identifier'),
				),
				s(
					'declaration_reassignment',
					s(
						'assignee',
						s('identifier'),
					),
					s('identifier'),
				),
				s(
					'statement_expression',
					s('identifier'),
				),
			),
		],

		DeclarationType: [
			xjs.String.dedent`
				{
					type T = A | B & C;
					type 'Ü' = T;
				}
			`,
			sourceStatements(
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
			),
		],

		DeclarationVariable: [
			xjs.String.dedent`
				{
					let v: T = a + b * c;
					let unfixed u: A | B & C = v;
					let 'å': A = a;
					let unfixed 'é': E = e;
				}
			`,
			sourceStatements(
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
			),
		],

		DeclarationClaim: [
			xjs.String.dedent`
				{
					claim my_var:       T;
					claim tuple.1:      U;
					claim record.prop:  V;
					claim list.[index]: W;
				}
			`,
			sourceStatements(
				s(
					'declaration_claim',
					s(
						'assignee',
						s('identifier'),
					),
					s('identifier'),
				),
				s(
					'declaration_claim',
					s(
						'assignee',
						s('identifier'),
						s('property_assign', s('integer')),
					),
					s('identifier'),
				),
				s(
					'declaration_claim',
					s(
						'assignee',
						s('identifier'),
						s('property_assign', s('word', s('identifier'))),
					),
					s('identifier'),
				),
				s(
					'declaration_claim',
					s(
						'assignee',
						s('identifier'),
						s('property_assign', s('identifier')),
					),
					s('identifier'),
				),
			),
		],

		DeclarationReassignment: [
			xjs.String.dedent`
				{
					set my_var       = a;
					set tuple.1      = b;
					set record.prop  = c;
					set list.[index] = d;
				}
			`,
			sourceStatements(
				s(
					'declaration_reassignment',
					s(
						'assignee',
						s('identifier'),
					),
					s('identifier'),
				),
				s(
					'declaration_reassignment',
					s(
						'assignee',
						s('identifier'),
						s('property_assign', s('integer')),
					),
					s('identifier'),
				),
				s(
					'declaration_reassignment',
					s(
						'assignee',
						s('identifier'),
						s('property_assign', s('word', s('identifier'))),
					),
					s('identifier'),
				),
				s(
					'declaration_reassignment',
					s(
						'assignee',
						s('identifier'),
						s('property_assign', s('identifier')),
					),
					s('identifier'),
				),
			),
		],

		// Declaration
		// see #Declaration{Type,Variable,Claim,Reassignment}
	})
		.map(([title, [source, expected]]) => buildTest(title, source, expected))
		.filter((test) => !!test)
		.join(''));
})().catch((err) => {
	console.error(err);
	process.exit(1);
});
