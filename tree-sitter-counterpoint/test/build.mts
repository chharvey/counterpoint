#!/usr/bin/env node

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as xjs from 'extrajs';



function s(name: string, ...operands: readonly string[]): string {
	return xjs.String.dedent`
		(${ name }
			${ operands.join('') }
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

function sourceExpressions(...expressions: readonly string[]): string {
	return sourceStatements(...expressions.map((expr) => s('statement_expression', expr)));
}



(async (): Promise<void> => {
	const FILEPATH = path.join(import.meta.dirname, './corpus/index.txt');
	await fs.promises.mkdir(path.dirname(FILEPATH), {recursive: true});
	return fs.promises.writeFile(FILEPATH, Object.entries({
		/* # TERMINALS */
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
				s('primitive_literal', s('integer')),
				s('primitive_literal', s('integer__separator')),
				s('primitive_literal', s('integer__separator')),
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
				s('primitive_literal', s('string')),
			),
		],

		// TEMPLATE_{FULL,HEAD,MIDDLE,TAIL}
		// tested in #StringTemplate



		/* # PRODUCTIONS */
		// Word
		// tested in #{PrimitiveLiteral,EntryType,PropertyAccessorType,Property,PropertyAccessor}

		KeywordType: [
			xjs.String.dedent`
				{
					type T = nothing;
					type T = bool;
					type T = sym;
					type T = int;
					type T = float;
					type T = str;
					type T = anything;
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

		KeywordValue: [
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

		PrimitiveLiteral: [
			xjs.String.dedent`
				{
					type T = null;
					type T = false;
					type T = true;
					type T = @type;
					type T = @bool;
					type T = @true;
					type T = @hello;
					type T = 42;
					type T = 4.2;
					type T = "hello";

					null;
					false;
					true;
					@let;
					@bool;
					@true;
					@hello;
					42;
					4.2;
					"hello";
				}
			`,
			(() => {
				const primitive_literals = [
					s('keyword_value'),
					s('keyword_value'),
					s('keyword_value'),
					s('word'),
					s('word', s('keyword_type')),
					s('word', s('keyword_value')),
					s('word', s('identifier')),
					s('integer'),
					s('float'),
					s('string'),
				].map((term) => s('primitive_literal', term));
				return sourceStatements(
					...primitive_literals.map((pl) => s('declaration_type', s('identifier'), pl)),
					...primitive_literals.map((pl) => s('statement_expression', pl)),
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
					type A = ();
					type B = (bool,);
					type C = (?: bool);
					type D = (bool, int);
					type E = (bool, ?: int);
					type U = (
						V.0,
						W.<float>,
					);
				}
			`,
			sourceTypes(
				s('type_tuple_literal'),
				s(
					'type_tuple_literal',
					s('entry_type', s('keyword_type')),
				),
				s(
					'type_tuple_literal',
					s('entry_type__optional', s('keyword_type')),
				),
				s(
					'type_tuple_literal',
					s('entry_type', s('keyword_type')),
					s('entry_type', s('keyword_type')),
				),
				s(
					'type_tuple_literal',
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
							s('property_accessor_type', s('integer')),
						),
					),
					s(
						'entry_type',
						s(
							'type_compound',
							s('identifier'),
							s('generic_arguments', s('keyword_type')),
						),
					),
				),
			),
		],

		TypeRecordLiteral: [
			xjs.String.dedent`
				{
					type T = (a: bool, b?: int, _: str);
					type U = (
						a: V.0,
						b: W.<float>,
					);
					type V = (let: str, bool: str, true: str, foo: str);
				}
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
							s('property_accessor_type', s('integer')),
						),
					),
					s(
						'entry_type__named',
						s('word', s('identifier')),
						s(
							'type_compound',
							s('identifier'),
							s('generic_arguments', s('keyword_type')),
						),
					),
				),
				s(
					'type_record_literal',
					s('entry_type__named', s('word'),                     s('keyword_type')),
					s('entry_type__named', s('word', s('keyword_type')),  s('keyword_type')),
					s('entry_type__named', s('word', s('keyword_value')), s('keyword_type')),
					s('entry_type__named', s('word', s('identifier')),    s('keyword_type')),
				),
			),
		],

		TypeListLiteral: [
			xjs.String.dedent`
				{
					type T = [bool];
				}
			`,
			sourceTypes(s(
				'type_list_literal',
				s('keyword_type'),
			)),
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

		TypeSetLiteral: [
			xjs.String.dedent`
				{
					type T = {bool};
				}
			`,
			sourceTypes(s(
				'type_set_literal',
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
		// consists of #{IDENTIFIER,KeywordType,PrimitiveLiteral,TypeGrouped,Type{Tuple,Record,Dict,Map}Literal}

		// PropertyAccessorType
		// tested in #TypeCompound

		// GenericCall
		// tested in #TypeCompound

		TypeCompound: [
			xjs.String.dedent`
				{
					type T = TupleType.0;
					type T = RecordType.prop;
					type T = RecordType._;
					type T = TupleType?.0;
					type T = RecordType?.prop;
					type T = RecordType?._;
					type T = Set.<T>;
					type T = SomeType.let;
					type T = SomeType.bool;
					type T = SomeType.true;
					type T = SomeType.foo;
				}
			`,
			sourceTypes(
				s(
					'type_compound',
					s('identifier'),
					s('property_accessor_type', s('integer')),
				),
				s(
					'type_compound',
					s('identifier'),
					s('property_accessor_type', s('word', s('identifier'))),
				),
				s(
					'type_compound',
					s('identifier'),
					s('property_accessor_type', s('word')),
				),
				s(
					'type_compound',
					s('identifier'),
					s('property_accessor_type', s('integer')),
				),
				s(
					'type_compound',
					s('identifier'),
					s('property_accessor_type', s('word', s('identifier'))),
				),
				s(
					'type_compound',
					s('identifier'),
					s('property_accessor_type', s('word')),
				),
				s(
					'type_compound',
					s('identifier'),
					s('generic_arguments', s('identifier')),
				),
				s(
					'type_compound',
					s('identifier'),
					s('property_accessor_type', s('word')),
				),
				s(
					'type_compound',
					s('identifier'),
					s('property_accessor_type', s('word', s('keyword_type'))),
				),
				s(
					'type_compound',
					s('identifier'),
					s('property_accessor_type', s('word', s('keyword_value'))),
				),
				s(
					'type_compound',
					s('identifier'),
					s('property_accessor_type', s('word', s('identifier'))),
				),
			),
		],

		TypeUnarySymbol: [
			xjs.String.dedent`
				{
					type T = T?;
					type T = T!;
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
			),
		],

		TypeUnaryKeyword: [
			xjs.String.dedent`
				{
					type T = mut T;
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
		// consists of #TypeUnion


		/* ## Expressions */
		StringTemplate: [
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

		// Property
		// tested in #RecordLiteral

		// Case
		// tested in #MapLiteral

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
					();
					(,a);
					(,a, b);
					(a, b, c);
					(1, (2,), ((3,),),);
				}
			`,
			sourceExpressions(
				s('tuple_literal'),
				s('tuple_literal', s('identifier')),
				s('tuple_literal', s('identifier'), s('identifier')),
				s('tuple_literal', s('identifier'), s('identifier'), s('identifier')),
				s(
					'tuple_literal',
					/* eslint-disable @stylistic/indent */
					                                      s('primitive_literal', s('integer')),
					                   s('tuple_literal', s('primitive_literal', s('integer'))),
					s('tuple_literal', s('tuple_literal', s('primitive_literal', s('integer')))),
					/* eslint-enable @stylistic/indent */
				),
			),
		],

		RecordLiteral: [
			xjs.String.dedent`
				{
					(a= 1, b= (x= 2), _= (y= (k= 3)), let= 4, bool= 5, true= 6);
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
				s(
					'property',
					s('word'),
					s('primitive_literal', s('integer')),
				),
				s(
					'property',
					s('word', s('keyword_type')),
					s('primitive_literal', s('integer')),
				),
				s(
					'property',
					s('word', s('keyword_value')),
					s('primitive_literal', s('integer')),
				),
			)),
		],

		ListLiteral: [
			xjs.String.dedent`
				{
					[1, 2, 3];
				}
			`,
			sourceExpressions(s(
				'list_literal',
				s('primitive_literal', s('integer')),
				s('primitive_literal', s('integer')),
				s('primitive_literal', s('integer')),
			)),
		],

		DictLiteral: [
			xjs.String.dedent`
				{
					[a= 1, b= [x= 2], _= [y= [k= 3]], let= 4, bool= 5, true= 6];
				}
			`,
			sourceExpressions(s(
				'dict_literal',
				s(
					'property',
					s('word', s('identifier')),
					s('primitive_literal', s('integer')),
				),
				s(
					'property',
					s('word', s('identifier')),
					s(
						'dict_literal',
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
						'dict_literal',
						s(
							'property',
							s('word', s('identifier')),
							s(
								'dict_literal',
								s(
									'property',
									s('word', s('identifier')),
									s('primitive_literal', s('integer')),
								),
							),
						),
					),
				),
				s(
					'property',
					s('word'),
					s('primitive_literal', s('integer')),
				),
				s(
					'property',
					s('word', s('keyword_type')),
					s('primitive_literal', s('integer')),
				),
				s(
					'property',
					s('word', s('keyword_value')),
					s('primitive_literal', s('integer')),
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
		// tested in #FunctionCall

		// ExpressionUnit
		// consists of #{IDENTIFIER,PrimitiveLiteral,StringTemplate,ExpressionGrouped,{Tuple,Record,Set,Map}Literal,Block}

		// PropertyAccessor
		// tested in #{ExpressionCompound,Assignee}

		// FunctionCall
		// tested in #ExpressionCompound

		ExpressionCompound: [
			xjs.String.dedent`
				{
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
					Dict.(record);
					Set.<T>();
					record.let;
					record.bool;
					record.true;
				}
			`,
			sourceExpressions(
				s(
					'expression_compound',
					s('identifier'),
					s('property_accessor', s('integer')),
				),
				s(
					'expression_compound',
					s('identifier'),
					s('property_accessor', s('integer')),
				),
				s(
					'expression_compound',
					s('identifier'),
					s('property_accessor', s('integer')),
				),
				s(
					'expression_compound',
					s('identifier'),
					s('property_accessor', s('word', s('identifier'))),
				),
				s(
					'expression_compound',
					s('identifier'),
					s('property_accessor', s('word', s('identifier'))),
				),
				s(
					'expression_compound',
					s('identifier'),
					s('property_accessor', s('word', s('identifier'))),
				),
				s(
					'expression_compound',
					s('identifier'),
					s('property_accessor', s('word')),
				),
				s(
					'expression_compound',
					s('identifier'),
					s('property_accessor', s('identifier')),
				),
				s(
					'expression_compound',
					s('identifier'),
					s('property_accessor', s('identifier')),
				),
				s(
					'expression_compound',
					s('identifier'),
					s('property_accessor', s('identifier')),
				),
				s(
					'expression_compound',
					s('identifier'),
					s('function_arguments'),
				),
				s(
					'expression_compound',
					s('identifier'),
					s('function_arguments', s('identifier')),
				),
				s(
					'expression_compound',
					s('identifier'),
					s('generic_arguments', s('identifier')),
					s('function_arguments'),
				),
				s(
					'expression_compound',
					s('identifier'),
					s('property_accessor', s('word')),
				),
				s(
					'expression_compound',
					s('identifier'),
					s('property_accessor', s('word', s('keyword_type'))),
				),
				s(
					'expression_compound',
					s('identifier'),
					s('property_accessor', s('word', s('keyword_value'))),
				),
			),
		],

		// Assignee
		// tested in #DeclarationReassignment

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

		ExpressionUnaryKeyword: [
			xjs.String.dedent`
				{
					int   value;
					float value;
				}
			`,
			sourceExpressions(
				s(
					'expression_unary_keyword',
					s('identifier'),
				),
				s(
					'expression_unary_keyword',
					s('identifier'),
				),
			),
		],

		ExpressionCast: [
			xjs.String.dedent`
				{
					value as  Klass;
					value as? Klass;
					value as! Klass;
					value as  <T>;
				}
			`,
			sourceExpressions(
				s(
					'expression_cast',
					s('identifier'),
					s('identifier'),
				),
				s(
					'expression_cast',
					s('identifier'),
					s('identifier'),
				),
				s(
					'expression_cast',
					s('identifier'),
					s('identifier'),
				),
				s(
					'expression_cast',
					s('identifier'),
					s('identifier'),
				),
			),
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
					if a then {b} else {c};
					if a then ({b}) else ({c});
					if a then ({ b; }) else ({ c; });
				}
			`,
			sourceExpressions(
				s(
					'expression_conditional',
					s('identifier'),
					s('identifier'),
					s('identifier'),
				),
				s(
					'expression_conditional',
					s('identifier'),
					s('set_literal', s('identifier')),
					s('set_literal', s('identifier')),
				),
				s(
					'expression_conditional',
					s('identifier'),
					s('expression_grouped', s('set_literal', s('identifier'))),
					s('expression_grouped', s('set_literal', s('identifier'))),
				),
				s(
					'expression_conditional',
					s('identifier'),
					s('expression_grouped', s('expression_block', s('statement_expression', s('identifier')))),
					s('expression_grouped', s('expression_block', s('statement_expression', s('identifier')))),
				),
			),
		],

		// Expression
		// consists of #Expression{Disjunctive,Conditional}


		/* ## Statements */
		StatementExpression: [
			xjs.String.dedent`
				{
					my_var;
				}
			`,
			sourceStatements(s('statement_expression', s('identifier'))),
		],

		StatementConditional: [
			xjs.String.dedent`
				{
					if     condition  then { consequent; };
					unless condition  then { alternative; };
					if     condition  then { consequent; }  else { alternative; };
					if     condition1 then { consequent1; } else if condition2 then { consequent2; } else { alternative; };
					if     condition1 then { consequent1; } else if condition2 then { consequent2; } else if condition3 then { consequent3; } else { alternative; };
				}
			`,
			sourceStatements(
				s('statement_conditional',         s('identifier'), s('block', s('statement_expression', s('identifier')))),
				s('statement_conditional__unless', s('identifier'), s('block', s('statement_expression', s('identifier')))),
				s(
					'statement_conditional',
					s('identifier'),
					s('block', s('statement_expression', s('identifier'))),
					s('block', s('statement_expression', s('identifier'))),
				),
				s(
					'statement_conditional',
					s('identifier'),
					s('block', s('statement_expression', s('identifier'))),
					s(
						'statement_conditional',
						s('identifier'),
						s('block', s('statement_expression', s('identifier'))),
						s('block', s('statement_expression', s('identifier'))),
					),
				),
				s(
					'statement_conditional',
					s('identifier'),
					s('block', s('statement_expression', s('identifier'))),
					s(
						'statement_conditional',
						s('identifier'),
						s('block', s('statement_expression', s('identifier'))),
						s(
							'statement_conditional',
							s('identifier'),
							s('block', s('statement_expression', s('identifier'))),
							s('block', s('statement_expression', s('identifier'))),
						),
					),
				),
			),
		],

		StatementLoop: [
			xjs.String.dedent`
				{
					while condition do { loop; };
					until condition do { loop; };
					do { loop; } while condition;
					do { loop; } until condition;
				}
			`,
			sourceStatements(
				s('statement_loop', s('identifier'), s('block', s('statement_expression', s('identifier')))),
				s('statement_loop', s('identifier'), s('block', s('statement_expression', s('identifier')))),
				s('statement_loop', s('block', s('statement_expression', s('identifier'))), s('identifier')),
				s('statement_loop', s('block', s('statement_expression', s('identifier'))), s('identifier')),
			),
		],

		StatementIteration: [
			xjs.String.dedent`
				{
					for _:  T of iterable do { iterate; };
					for it: T of iterable do { iterate; };
				}
			`,
			sourceStatements(
				s('statement_iteration',                  s('identifier'), s('identifier'), s('block', s('statement_expression', s('identifier')))),
				s('statement_iteration', s('identifier'), s('identifier'), s('identifier'), s('block', s('statement_expression', s('identifier')))),
			),
		],

		// Statement
		// consists of #{Statement{Expression,Conditional,Loop,Iteration},Declaration}

		Block: [
			xjs.String.dedent`
				{
					type T = U;
					let a: T = b;
					claim a: U;
					set a = b;
					a;
					{
						b;
					};
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
				s(
					'statement_expression',
					s('expression_block', s('statement_expression', s('identifier'))),
				),
			),
		],

		DeclarationType: [
			xjs.String.dedent`
				{
					type T = A | B & C;
					type 'Ü' = T;
					type _ = D;
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
				s(
					'declaration_type',
					s('identifier'),
				),
			),
		],

		DeclarationVariable: [
			xjs.String.dedent`
				{
					let v: T = a + b * c;
					let var u: A | B & C = v;
					let 'å': A = a;
					let var 'é': E = e;
					let _: T = v;
					let var _: T = v;
					let var uninit?: T;
					let var _?: T;
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
				s(
					'declaration_variable',
					s('identifier'),
					s('identifier'),
				),
				s(
					'declaration_variable',
					s('identifier'),
					s('identifier'),
				),
				s(
					'declaration_variable',
					s('identifier'),
					s('identifier'),
				),
				s(
					'declaration_variable',
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
					claim record._:     X;
					claim list.[index]: W;
					claim record.let:   Y;
					claim record.bool:  Z;
					claim record.true:  S;
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
						s('property_accessor', s('integer')),
					),
					s('identifier'),
				),
				s(
					'declaration_claim',
					s(
						'assignee',
						s('identifier'),
						s('property_accessor', s('word', s('identifier'))),
					),
					s('identifier'),
				),
				s(
					'declaration_claim',
					s(
						'assignee',
						s('identifier'),
						s('property_accessor', s('word')),
					),
					s('identifier'),
				),
				s(
					'declaration_claim',
					s(
						'assignee',
						s('identifier'),
						s('property_accessor', s('identifier')),
					),
					s('identifier'),
				),
				s(
					'declaration_claim',
					s(
						'assignee',
						s('identifier'),
						s('property_accessor', s('word')),
					),
					s('identifier'),
				),
				s(
					'declaration_claim',
					s(
						'assignee',
						s('identifier'),
						s('property_accessor', s('word', s('keyword_type'))),
					),
					s('identifier'),
				),
				s(
					'declaration_claim',
					s(
						'assignee',
						s('identifier'),
						s('property_accessor', s('word', s('keyword_value'))),
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
					set record._     = c;
					set list.[index] = d;
					set record.let   = 1;
					set record.bool  = 2;
					set record.true  = 3;
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
						s('property_accessor', s('integer')),
					),
					s('identifier'),
				),
				s(
					'declaration_reassignment',
					s(
						'assignee',
						s('identifier'),
						s('property_accessor', s('word', s('identifier'))),
					),
					s('identifier'),
				),
				s(
					'declaration_reassignment',
					s(
						'assignee',
						s('identifier'),
						s('property_accessor', s('word')),
					),
					s('identifier'),
				),
				s(
					'declaration_reassignment',
					s(
						'assignee',
						s('identifier'),
						s('property_accessor', s('identifier')),
					),
					s('identifier'),
				),
				s(
					'declaration_reassignment',
					s(
						'assignee',
						s('identifier'),
						s('property_accessor', s('word')),
					),
					s('primitive_literal', s('integer')),
				),
				s(
					'declaration_reassignment',
					s(
						'assignee',
						s('identifier'),
						s('property_accessor', s('word', s('keyword_type'))),
					),
					s('primitive_literal', s('integer')),
				),
				s(
					'declaration_reassignment',
					s(
						'assignee',
						s('identifier'),
						s('property_accessor', s('word', s('keyword_value'))),
					),
					s('primitive_literal', s('integer')),
				),
			),
		],

		// Declaration
		// consists of #Declaration{Type,Variable,Claim,Reassignment}
	}).map(([title, [source, expected]]) => xjs.String.dedent`
		${ '='.repeat(title.length) }
		${ title }
		${ '='.repeat(title.length) }

		${ source }

		---

		${ expected }
	`).filter((test) => !!test).join(''));
})().catch((err) => {
	console.error(err);
	process.exit(1);
});
