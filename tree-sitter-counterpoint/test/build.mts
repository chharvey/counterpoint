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

function sourceTypes(...types: readonly string[]): string {
	return s(
		'source_file',
		types.map((typ) => s('declaration_type', s('identifier'), typ)).join(''),
	);
}

function sourceExpressions(...expressions: readonly string[]): string {
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

		KEYWORDVALUE: [
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

		TEMPLATE: [
			xjs.String.dedent`
				"""hello {{ to }} the
				the {{ big }} world""";

				"""hello {{ to }} the {{ whole }} great {{ big }} world""";

				"""hello {{ """to {{ """the
				the""" }} big""" }} world""";
			`,
			sourceExpressions(
				s(
					'string_template__variable',
					s('template_head'),
					s('identifier'),
					s('template_middle'),
					s('identifier'),
					s('template_tail'),
				),
				s(
					'string_template__variable',
					s('template_head'),
					s('identifier'),
					s('template_middle'),
					s('identifier'),
					s('template_middle'),
					s('identifier'),
					s('template_tail'),
				),
				s(
					'string_template__variable',
					s('template_head'),
					s(
						'string_template__variable',
						s('template_head'),
						s(
							'string_template__variable',
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
				type T = (42);
				type T = (int);
				type T = (T);
			`,
			sourceTypes(
				s('type_grouped__variable', s('primitive_literal', s('integer'))),
				s('type_grouped__variable', s('keyword_type')),
				s('type_grouped__variable', s('identifier')),
			),
		],

		TypeTupleLiteral: [
			xjs.String.dedent`
				type T = \\[bool, int, ?: str];
				type T = [bool, int, ?: str];
				type U = \\[
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
					'type_tuple_literal__variable',
					s('entry_type__variable',           s('keyword_type')),
					s('entry_type__variable',           s('keyword_type')),
					s('entry_type__optional__variable', s('keyword_type')),
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
				type T = \\[a: bool, b?: int, c: str];
				type T = [a: bool, b?: int, c: str];
				type U = \\[
					a: V.0,
					b: W.<float>,
				];
			`,
			sourceTypes(
				s(
					'type_record_literal',
					s('entry_type__named',           s('word', s('identifier')), s('keyword_type')),
					s('entry_type__named__optional', s('word', s('identifier')), s('keyword_type')),
					s('entry_type__named',           s('word', s('identifier')), s('keyword_type')),
				),
				s(
					'type_record_literal__variable',
					s('entry_type__named__variable',           s('word', s('identifier')), s('keyword_type')),
					s('entry_type__named__optional__variable', s('word', s('identifier')), s('keyword_type')),
					s('entry_type__named__variable',           s('word', s('identifier')), s('keyword_type')),
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
		// see #KEYWORDTYPE,IDENTIFIER,PrimitiveLiteral,Type{Grouped,{Tuple,Record,Dict,Map}Literal}

		// PropertyAccessType
		// see #TypeCompound

		// GenericCall
		// see #TypeCompound

		TypeCompound: [
			xjs.String.dedent`
				type T = TupleType.0;
				type T = RecordType.prop;
				type T = Set.<T>;
			`,
			sourceTypes(
				s(
					'type_compound__variable',
					s('identifier'),
					s('property_access_type', s('integer')),
				),
				s(
					'type_compound__variable',
					s('identifier'),
					s('property_access_type', s('word', s('identifier'))),
				),
				s(
					'type_compound__variable',
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
				type T = bool\\[3];
				type T = T[];
				type T = T[3];
				type T = T{};
			`,
			sourceTypes(
				s(
					'type_unary_symbol__variable',
					s('identifier'),
				),
				s(
					'type_unary_symbol__variable',
					s('identifier'),
				),
				s(
					'type_unary_symbol__variable',
					s('keyword_type'),
					s('integer'),
				),
				s(
					'type_unary_symbol__variable',
					s('identifier'),
				),
				s(
					'type_unary_symbol__variable',
					s('identifier'),
					s('integer'),
				),
				s(
					'type_unary_symbol__variable',
					s('identifier'),
				),
			),
		],

		TypeUnaryKeyword: [
			xjs.String.dedent`
				type T = mutable T;
			`,
			sourceTypes(s(
				'type_unary_keyword__variable',
				s('identifier'),
			)),
		],

		TypeIntersection: [
			xjs.String.dedent`
				type T = T & U;
			`,
			sourceTypes(s(
				'type_intersection__variable',
				s('identifier'),
				s('identifier'),
			)),
		],

		TypeUnion: [
			xjs.String.dedent`
				type T = T | U;
			`,
			sourceTypes(s(
				'type_union__variable',
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
				(42);
				(a);
			`,
			sourceExpressions(
				s('expression_grouped__variable', s('primitive_literal', s('integer'))),
				s('expression_grouped__variable', s('identifier')),
			),
		],

		TupleLiteral: [
			xjs.String.dedent`
				\\[1, \\[2], \\[3]];
				  [1, \\[2],   [3]];
			`,
			sourceExpressions(
				s(
					'tuple_literal',
					                   s('primitive_literal', s('integer')),
					s('tuple_literal', s('primitive_literal', s('integer'))),
					s('tuple_literal', s('primitive_literal', s('integer'))),
				),
				s(
					'tuple_literal__variable',
					                             s('primitive_literal', s('integer')),
					s('tuple_literal',           s('primitive_literal', s('integer'))),
					s('tuple_literal__variable', s('primitive_literal', s('integer'))),
				),
			),
		],

		RecordLiteral: [
			xjs.String.dedent`
				\\[a= 1, b= \\[x= 2], c= \\[y= 3]];
				  [a= 1, b= \\[x= 2], c=   [y= 3]];
			`,
			sourceExpressions(
				s(
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
								s('primitive_literal', s('integer')),
							),
						),
					),
				),
				s(
					'record_literal__variable',
					s(
						'property__variable',
						s('word', s('identifier')),
						s('primitive_literal', s('integer')),
					),
					s(
						'property__variable',
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
						'property__variable',
						s('word', s('identifier')),
						s(
							'record_literal__variable',
							s(
								'property__variable',
								s('word', s('identifier')),
								s('primitive_literal', s('integer')),
							),
						),
					),
				),
			),
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
				Dict.([]);
				Set.<T>();
			`,
			sourceExpressions(
				s(
					'expression_compound__variable',
					s('identifier'),
					s('property_access__variable', s('integer')),
				),
				s(
					'expression_compound__variable',
					s('identifier'),
					s('property_access__variable', s('integer')),
				),
				s(
					'expression_compound__variable',
					s('identifier'),
					s('property_access__variable', s('integer')),
				),
				s(
					'expression_compound__variable',
					s('identifier'),
					s('property_access__variable', s('word', s('identifier'))),
				),
				s(
					'expression_compound__variable',
					s('identifier'),
					s('property_access__variable', s('word', s('identifier'))),
				),
				s(
					'expression_compound__variable',
					s('identifier'),
					s('property_access__variable', s('word', s('identifier'))),
				),
				s(
					'expression_compound__variable',
					s('identifier'),
					s('property_access__variable', s('identifier')),
				),
				s(
					'expression_compound__variable',
					s('identifier'),
					s('property_access__variable', s('identifier')),
				),
				s(
					'expression_compound__variable',
					s('identifier'),
					s('property_access__variable', s('identifier')),
				),
				s(
					'expression_compound__variable',
					s('identifier'),
					s('function_call', s('function_arguments')),
				),
				s(
					'expression_compound__variable',
					s('identifier'),
					s(
						'function_call',
						s(
							'function_arguments',
							s('tuple_literal__variable'),
						),
					),
				),
				s(
					'expression_compound__variable',
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
			sourceExpressions(
				s(
					'expression_unary_symbol__variable',
					s('identifier'),
				),
				s(
					'expression_unary_symbol__variable',
					s('identifier'),
				),
				s(
					'expression_unary_symbol__variable',
					s('identifier'),
				),
				s(
					'expression_unary_symbol__variable',
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
					'expression_exponential__variable',
					s('identifier'),
					s('identifier'),
				),
				s(
					'expression_exponential__variable',
					s('identifier'),
					s(
						'expression_exponential__variable',
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
					'expression_multiplicative__variable',
					s('identifier'),
					s('identifier'),
				),
				s(
					'expression_multiplicative__variable',
					s('identifier'),
					s('identifier'),
				),
				s(
					'expression_multiplicative__variable',
					s(
						'expression_multiplicative__variable',
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
					'expression_additive__variable',
					s('identifier'),
					s('identifier'),
				),
				s(
					'expression_additive__variable',
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
					'expression_comparative__variable',
					s('identifier'),
					s('identifier'),
				),
				s(
					'expression_comparative__variable',
					s('identifier'),
					s('identifier'),
				),
				s(
					'expression_comparative__variable',
					s('identifier'),
					s('identifier'),
				),
				s(
					'expression_comparative__variable',
					s('identifier'),
					s('identifier'),
				),
				s(
					'expression_comparative__variable',
					s('identifier'),
					s('identifier'),
				),
				s(
					'expression_comparative__variable',
					s('identifier'),
					s('identifier'),
				),
				s(
					'expression_comparative__variable',
					s('identifier'),
					s('identifier'),
				),
				s(
					'expression_comparative__variable',
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
					'expression_equality__variable',
					s('identifier'),
					s('identifier'),
				),
				s(
					'expression_equality__variable',
					s('identifier'),
					s('identifier'),
				),
				s(
					'expression_equality__variable',
					s('identifier'),
					s('identifier'),
				),
				s(
					'expression_equality__variable',
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
					'expression_conjunctive__variable',
					s('identifier'),
					s('identifier'),
				),
				s(
					'expression_conjunctive__variable',
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
					'expression_disjunctive__variable',
					s('identifier'),
					s('identifier'),
				),
				s(
					'expression_disjunctive__variable',
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
				'expression_conditional__variable',
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
				type 'Ü' = T;
			`,
			s(
				'source_file',
				s(
					'declaration_type',
					s('identifier'),
					s(
						'type_union__variable',
						s('identifier'),
						s(
							'type_intersection__variable',
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
				let v: T = a + b * c;
				let unfixed u: A | B & C = v;
				let 'å': A = a;
				let unfixed 'é': E = e;
			`,
			s(
				'source_file',
				s(
					'declaration_variable',
					s('identifier'),
					s('identifier'),
					s(
						'expression_additive__variable',
						s('identifier'),
						s(
							'expression_multiplicative__variable',
							s('identifier'),
							s('identifier'),
						),
					),
				),
				s(
					'declaration_variable',
					s('identifier'),
					s(
						'type_union__variable',
						s('identifier'),
						s(
							'type_intersection__variable',
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
