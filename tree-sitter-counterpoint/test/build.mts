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

function extractType(operand: string): string {
	return s(
		'expression_compound',
		s('identifier'),
		s(
			'function_call',
			s(
				'generic_arguments',
				operand,
			),
			s('function_arguments'),
		),
	);
}

function makeSourceFile(...expressions: readonly string[]): string {
	return s(
		'source_file',
		expressions.map((expr) => s('statement_expression', expr)).join(''),
	);
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
				f.<void>();
				f.<bool>();
				f.<int>();
				f.<float>();
				f.<str>();
				f.<obj>();
			`,
			makeSourceFile(
				extractType(s('keyword_type')),
				extractType(s('keyword_type')),
				extractType(s('keyword_type')),
				extractType(s('keyword_type')),
				extractType(s('keyword_type')),
				extractType(s('keyword_type')),
			),
		],

		KEYWORDVALUE: [
			xjs.String.dedent`
				null;
				false;
				true;
			`,
			makeSourceFile(
				s('primitive_literal', s('keyword_value')),
				s('primitive_literal', s('keyword_value')),
				s('primitive_literal', s('keyword_value')),
			),
		],

		IDENTIFIER: [
			xjs.String.dedent`
				my_variable;
			`,
			makeSourceFile(s('identifier')),
		],

		INTEGER: [
			xjs.String.dedent`
				42;
				\\b01000101;
				4_2;
				\\b0100_0101;
			`,
			makeSourceFile(
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
			makeSourceFile(
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
				'hello world';

				'hello world %ignore';

				'hello %ignore
				world';

				'hello world %%ignore
				ignore';

				'hello %%ignore
				ignore%% world';

				'hello\\u{0020}world';

				'hello\\u{00_20}world';
			`,
			makeSourceFile(
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
				'''hello {{ to }} the
				the {{ big }} world''';

				'''hello {{ to }} the {{ whole }} great {{ big }} world''';

				'''hello {{ '''to {{ '''the
				the''' }} big''' }} world''';
			`,
			makeSourceFile(
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
				f.<(T)>();
			`,
			makeSourceFile(extractType(s('type_grouped', s('identifier')))),
		],

		TypeTupleLiteral: [
			xjs.String.dedent`
				f.<[bool, int, ?: str]>();
			`,
			makeSourceFile(extractType(s(
				'type_tuple_literal',
				s('entry_type',           s('keyword_type')),
				s('entry_type',           s('keyword_type')),
				s('entry_type__optional', s('keyword_type')),
			))),
		],

		TypeRecordLiteral: [
			xjs.String.dedent`
				f.<[a: bool, b?: int, c: str]>();
			`,
			makeSourceFile(extractType(s(
				'type_record_literal',
				s('entry_type__named',           s('word', s('identifier')), s('keyword_type')),
				s('entry_type__named__optional', s('word', s('identifier')), s('keyword_type')),
				s('entry_type__named',           s('word', s('identifier')), s('keyword_type')),
			))),
		],

		TypeHashLiteral: [
			xjs.String.dedent`
				f.<[: bool]>();
			`,
			makeSourceFile(extractType(s(
				'type_hash_literal',
				s('keyword_type'),
			))),
		],

		TypeMapLiteral: [
			xjs.String.dedent`
				f.<{int -> float}>();
			`,
			makeSourceFile(extractType(s(
				'type_map_literal',
				s('keyword_type'),
				s('keyword_type'),
			))),
		],

		// TypeUnit
		// see #KEYWORDTYPE,IDENTIFIER,PrimitiveLiteral,Type{Grouped,{Tuple,Record,Hash,Map}Literal}

		// PropertyAccessType
		// see #TypeCompound

		// GenericCall
		// see #TypeCompound

		TypeCompound: [
			xjs.String.dedent`
				f.<TupleType.0>();
				f.<RecordType.prop>();
				f.<Set.<T>>();
			`,
			makeSourceFile(
				extractType(s(
					'type_compound',
					s('identifier'),
					s('property_access_type', s('integer')),
				)),
				extractType(s(
					'type_compound',
					s('identifier'),
					s('property_access_type', s('word', s('identifier'))),
				)),
				extractType(s(
					'type_compound',
					s('identifier'),
					s(
						'generic_call',
						s(
							'generic_arguments',
							s('identifier'),
						),
					),
				)),
			),
		],

		TypeUnarySymbol: [
			xjs.String.dedent`
				f.<T?>();
				f.<T!>();
				f.<T[]>();
				f.<T[3]>();
				f.<T{}>();
			`,
			makeSourceFile(
				extractType(s(
					'type_unary_symbol',
					s('identifier'),
				)),
				extractType(s(
					'type_unary_symbol',
					s('identifier'),
				)),
				extractType(s(
					'type_unary_symbol',
					s('identifier'),
				)),
				extractType(s(
					'type_unary_symbol',
					s('identifier'),
					s('integer'),
				)),
				extractType(s(
					'type_unary_symbol',
					s('identifier'),
				)),
			),
		],

		TypeUnaryKeyword: [
			xjs.String.dedent`
				f.<mutable T>();
			`,
			makeSourceFile(extractType(s(
				'type_unary_keyword',
				s('identifier'),
			))),
		],

		TypeIntersection: [
			xjs.String.dedent`
				f.<T & U>();
			`,
			makeSourceFile(extractType(s(
				'type_intersection',
				s('identifier'),
				s('identifier'),
			))),
		],

		TypeUnion: [
			xjs.String.dedent`
				f.<T | U>();
			`,
			makeSourceFile(extractType(s(
				'type_union',
				s('identifier'),
				s('identifier'),
			))),
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
				(a);
			`,
			makeSourceFile(s('expression_grouped', s('identifier'))),
		],

		TupleLiteral: [
			xjs.String.dedent`
				[1, 2, 3];
			`,
			makeSourceFile(s(
				'tuple_literal',
				s('primitive_literal', s('integer')),
				s('primitive_literal', s('integer')),
				s('primitive_literal', s('integer')),
			)),
		],

		RecordLiteral: [
			xjs.String.dedent`
				[a= 1, b= 2, c= 3];
			`,
			makeSourceFile(s(
				'record_literal',
				s(
					'property',
					s('word', s('identifier')),
					s('primitive_literal', s('integer')),
				),
				s(
					'property',
					s('word', s('identifier')),
					s('primitive_literal', s('integer')),
				),
				s(
					'property',
					s('word', s('identifier')),
					s('primitive_literal', s('integer')),
				),
			)),
		],

		SetLiteral: [
			xjs.String.dedent`
				{1, 2, 3};
			`,
			makeSourceFile(s(
				'set_literal',
				s('primitive_literal', s('integer')),
				s('primitive_literal', s('integer')),
				s('primitive_literal', s('integer')),
			)),
		],

		MapLiteral: [
			xjs.String.dedent`
				{'1' -> 1, '2' -> 2, '3' -> 3};
			`,
			makeSourceFile(s(
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
				Hash.([]);
				Set.<T>();
			`,
			makeSourceFile(
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
		// see #StatementAssignment

		ExpressionUnarySymbol: [
			xjs.String.dedent`
				!value;
				?value;
				+value;
				-value;
			`,
			makeSourceFile(
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
			makeSourceFile(
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
			makeSourceFile(
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
			makeSourceFile(
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
			makeSourceFile(
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
				a !== b;
			`,
			makeSourceFile(
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
			makeSourceFile(
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
			makeSourceFile(
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
			makeSourceFile(s(
				'expression_conditional',
				s('identifier'),
				s('identifier'),
				s('identifier'),
			)),
		],

		// Expression
		// see #Expression{Disjunctive,Conditional}


		/* ## Statements */
		DeclarationType: [
			xjs.String.dedent`
				type T = A | B & C;
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
			),
		],

		DeclarationVariable: [
			xjs.String.dedent`
				let v: T = a + b * c;
				let unfixed u: A | B & C = v;
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
			),
		],

		// Declaration
		// see #Declaration{Type,Variable}

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
						s('property_assign', s('identifier')),
					),
					s('identifier'),
				),
			),
		],

		// Statement
		// see #{Declaration,Statement{Expression,Assignment}}
	})
		.map(([title, [source, expected]]) => buildTest(title, source, expected))
		.filter((test) => !!test)
		.join(''));
})().catch((err) => {
	console.error(err);
	process.exit(1);
});
