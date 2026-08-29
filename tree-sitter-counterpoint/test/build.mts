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

function f(fieldname: string, name: string, ...operands: readonly string[]): string {
	return `${ fieldname }: ${ s(name, ...operands) }`;
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
	return sourceStatements(...types.map((typ) => s('declaration_type', f('identifier_0', 'identifier'), `type_0: ${ typ }`)));
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
					-42;
					-\\b01000101;
					-4_2;
					-\\b0100_0101;
				}
			`,
			sourceExpressions(
				s('primitive_literal', s('integer')),
				s('primitive_literal', s('integer')),
				s('primitive_literal', s('integer')),
				s('primitive_literal', s('integer')),
				s('primitive_literal', s('integer')),
				s('primitive_literal', s('integer')),
				s('primitive_literal', s('integer')),
				s('primitive_literal', s('integer')),
			),
		],

		NATURAL: [
			xjs.String.dedent`
				{
					+42;
					+\\b01000101;
					+4_2;
					+\\b0100_0101;
				}
			`,
			sourceExpressions(
				s('primitive_literal', s('natural')),
				s('primitive_literal', s('natural')),
				s('primitive_literal', s('natural')),
				s('primitive_literal', s('natural')),
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
				s('primitive_literal', s('float')),
				s('primitive_literal', s('float')),
				s('primitive_literal', s('float')),
				s('primitive_literal', s('float')),
				s('primitive_literal', s('float')),
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
					type T = nat;
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
					type T = -42;
					type T = +42;
					type T = 4.2;
					type T = "hello";

					null;
					false;
					true;
					@type;
					@bool;
					@true;
					@hello;
					42;
					-42;
					+42;
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
					s('integer'),
					s('natural'),
					s('float'),
					s('string'),
				].map((term) => s('primitive_literal', term));
				return sourceStatements(
					...primitive_literals.map((pl) => s('declaration_type', f('identifier_0', 'identifier'), `type_0: ${ pl }`)),
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

		// ParametersType
		// tested in #TypeFunction

		// PropertyAccessorType
		// tested in #TypeCompound

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
					type D = (bool?, int);
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
					s('entry_type', f('type_0', 'keyword_type')),
				),
				s(
					'type_tuple_literal',
					s('entry_type__optional', f('type_0', 'keyword_type')),
				),
				s(
					'type_tuple_literal',
					s('entry_type', f('type_0', 'keyword_type')),
					s('entry_type', f('type_0', 'keyword_type')),
				),
				s(
					'type_tuple_literal',
					s('entry_type', f('type_0', 'type_unary_symbol', s('keyword_type'))),
					s('entry_type', f('type_0', 'keyword_type')),
				),
				s(
					'type_tuple_literal',
					s('entry_type',           f('type_0', 'keyword_type')),
					s('entry_type__optional', f('type_0', 'keyword_type')),
				),
				s(
					'type_tuple_literal',
					s(
						'entry_type',
						f(
							'type_0',
							'type_compound',
							f('type_0', 'identifier'),
							f('property_accessor_type_0', 'property_accessor_type', s('integer')),
						),
					),
					s(
						'entry_type',
						f(
							'type_0',
							'type_compound',
							f('type_0', 'identifier'),
							f('generic_arguments_0', 'generic_arguments', s('keyword_type')),
						),
					),
				),
			),
		],

		TypeRecordLiteral: [
			xjs.String.dedent`
				{
					type T = (a:  bool, b?: int, _: str);
					type T = (a?: bool, b:  int, _: str);
					type U = (
						a: V.0,
						b: W.<float>,
					);
					type V = (type: str, bool: str, true: str, foo: str);
				}
			`,
			sourceTypes(
				s(
					'type_record_literal',
					s('entry_type__named',           f('word_0', 'word', s('identifier')), f('type_0', 'keyword_type')),
					s('entry_type__named__optional', f('word_0', 'word', s('identifier')), f('type_0', 'keyword_type')),
					s('entry_type__named',           f('word_0', 'word'),                  f('type_0', 'keyword_type')),
				),
				s(
					'type_record_literal',
					s('entry_type__named__optional', f('word_0', 'word', s('identifier')), f('type_0', 'keyword_type')),
					s('entry_type__named',           f('word_0', 'word', s('identifier')), f('type_0', 'keyword_type')),
					s('entry_type__named',           f('word_0', 'word'),                  f('type_0', 'keyword_type')),
				),
				s(
					'type_record_literal',
					s(
						'entry_type__named',
						f('word_0', 'word', s('identifier')),
						f(
							'type_0',
							'type_compound',
							f('type_0', 'identifier'),
							f('property_accessor_type_0', 'property_accessor_type', s('integer')),
						),
					),
					s(
						'entry_type__named',
						f('word_0', 'word', s('identifier')),
						f(
							'type_0',
							'type_compound',
							f('type_0', 'identifier'),
							f('generic_arguments_0', 'generic_arguments', s('keyword_type')),
						),
					),
				),
				s(
					'type_record_literal',
					s('entry_type__named', f('word_0', 'word'),                     f('type_0', 'keyword_type')),
					s('entry_type__named', f('word_0', 'word', s('keyword_type')),  f('type_0', 'keyword_type')),
					s('entry_type__named', f('word_0', 'word', s('keyword_value')), f('type_0', 'keyword_type')),
					s('entry_type__named', f('word_0', 'word', s('identifier')),    f('type_0', 'keyword_type')),
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

		// GenericCall
		// tested in #TypeCompound

		TypeCompound: [
			xjs.String.dedent`
				{
					type T = TupleType.0;
					type T = TupleType.-1;
					type T = TupleType.+1;
					type T = RecordType.prop;
					type T = RecordType._;
					type T = TupleType?.0;
					type T = RecordType?.prop;
					type T = RecordType?._;
					type T = Set.<T>;
					type T = SomeType.type;
					type T = SomeType.bool;
					type T = SomeType.true;
					type T = SomeType.foo;
				}
			`,
			sourceTypes(
				s(
					'type_compound',
					f('type_0', 'identifier'),
					f('property_accessor_type_0', 'property_accessor_type', s('integer')),
				),
				s(
					'type_compound',
					f('type_0', 'identifier'),
					f('property_accessor_type_0', 'property_accessor_type', s('integer')),
				),
				s(
					'type_compound',
					f('type_0', 'identifier'),
					f('property_accessor_type_0', 'property_accessor_type', s('natural')),
				),
				s(
					'type_compound',
					f('type_0', 'identifier'),
					f('property_accessor_type_0', 'property_accessor_type', s('word', s('identifier'))),
				),
				s(
					'type_compound',
					f('type_0', 'identifier'),
					f('property_accessor_type_0', 'property_accessor_type', s('word')),
				),
				s(
					'type_compound',
					f('type_0', 'identifier'),
					f('property_accessor_type_0', 'property_accessor_type', s('integer')),
				),
				s(
					'type_compound',
					f('type_0', 'identifier'),
					f('property_accessor_type_0', 'property_accessor_type', s('word', s('identifier'))),
				),
				s(
					'type_compound',
					f('type_0', 'identifier'),
					f('property_accessor_type_0', 'property_accessor_type', s('word')),
				),
				s(
					'type_compound',
					f('type_0', 'identifier'),
					f('generic_arguments_0', 'generic_arguments', s('identifier')),
				),
				s(
					'type_compound',
					f('type_0', 'identifier'),
					f('property_accessor_type_0', 'property_accessor_type', s('word')),
				),
				s(
					'type_compound',
					f('type_0', 'identifier'),
					f('property_accessor_type_0', 'property_accessor_type', s('word', s('keyword_type'))),
				),
				s(
					'type_compound',
					f('type_0', 'identifier'),
					f('property_accessor_type_0', 'property_accessor_type', s('word', s('keyword_value'))),
				),
				s(
					'type_compound',
					f('type_0', 'identifier'),
					f('property_accessor_type_0', 'property_accessor_type', s('word', s('identifier'))),
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

		TypeFunction: [
			xjs.String.dedent`
				{
					type T = \\() => void;
					type T = \\(A, b: B) => void;
					type T = \\(\\() => void) => void;
					type T = \\() => bool;
				}
			`,
			sourceTypes(
				s('type_function'),
				s(
					'type_function',
					s('entry_type',        f('type_0', 'identifier')),
					s('entry_type__named', f('word_0', 'word', s('identifier')), f('type_0', 'identifier')),
				),
				s(
					'type_function',
					s('entry_type', f('type_0', 'type_function')),
				),
				s('type_function', f('type_0', 'keyword_type')),
			),
		],

		// Type
		// consists of #Type{Union,Function}


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

		// CaseMap
		// tested in #MapLiteral

		// CaseSwitch
		// tested in #ExpressionSwitch

		// ParameterFunction
		// tested in #ParametersFunction

		// ParametersFunction
		// tested in #{Expression,Declaration}Function

		// PropertyAccessor
		// tested in #{ExpressionCompound,Assignee}

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
				s('expression_tuple_literal'),
				s('expression_tuple_literal', s('identifier')),
				s('expression_tuple_literal', s('identifier'), s('identifier')),
				s('expression_tuple_literal', s('identifier'), s('identifier'), s('identifier')),
				s(
					'expression_tuple_literal',
					/* eslint-disable @stylistic/indent */
					                                                            s('primitive_literal', s('integer')),
					                              s('expression_tuple_literal', s('primitive_literal', s('integer'))),
					s('expression_tuple_literal', s('expression_tuple_literal', s('primitive_literal', s('integer')))),
					/* eslint-enable @stylistic/indent */
				),
			),
		],

		RecordLiteral: [
			xjs.String.dedent`
				{
					(a= 1, b= (x= 2), _= (y= (k= 3)), type= 4, bool= 5, true= 6);
				}
			`,
			sourceExpressions(s(
				'expression_record_literal',
				s(
					'property',
					s('word', s('identifier')),
					s('primitive_literal', s('integer')),
				),
				s(
					'property',
					s('word', s('identifier')),
					s(
						'expression_record_literal',
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
						'expression_record_literal',
						s(
							'property',
							s('word', s('identifier')),
							s(
								'expression_record_literal',
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
				'expression_list_literal',
				s('primitive_literal', s('integer')),
				s('primitive_literal', s('integer')),
				s('primitive_literal', s('integer')),
			)),
		],

		DictLiteral: [
			xjs.String.dedent`
				{
					[a= 1, b= [x= 2], _= [y= [k= 3]], type= 4, bool= 5, true= 6];
				}
			`,
			sourceExpressions(s(
				'expression_dict_literal',
				s(
					'property',
					s('word', s('identifier')),
					s('primitive_literal', s('integer')),
				),
				s(
					'property',
					s('word', s('identifier')),
					s(
						'expression_dict_literal',
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
						'expression_dict_literal',
						s(
							'property',
							s('word', s('identifier')),
							s(
								'expression_dict_literal',
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
				'expression_set_literal',
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
				'expression_map_literal',
				s(
					'case_map',
					s('primitive_literal', s('string')),
					s('primitive_literal', s('integer')),
				),
				s(
					'case_map',
					s('primitive_literal', s('string')),
					s('primitive_literal', s('integer')),
				),
				s(
					'case_map',
					s('primitive_literal', s('string')),
					s('primitive_literal', s('integer')),
				),
			)),
		],

		// FunctionArguments
		// tested in #FunctionCall

		// ExpressionUnit
		// consists of #{IDENTIFIER,PrimitiveLiteral,StringTemplate,ExpressionGrouped,{Tuple,Record,Set,Map}Literal,Block}

		// FunctionCall
		// tested in #ExpressionCompound

		ExpressionCompound: [
			xjs.String.dedent`
				{
					42.prop;
					4.2.prop;
					maybe~?;
					result~!;
					tuple.0;
					tuple.-1;
					tuple.+1;
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
					record.type;
					record.bool;
					record.true;
				}
			`,
			sourceExpressions(
				s(
					'expression_compound',
					f('expression_0', 'primitive_literal', s('integer')),
					f('property_accessor_0', 'property_accessor', s('word', s('identifier'))),
				),
				s(
					'expression_compound',
					f('expression_0', 'primitive_literal', s('float')),
					f('property_accessor_0', 'property_accessor', s('word', s('identifier'))),
				),
				s(
					'expression_compound',
					f('expression_0', 'identifier'),
				),
				s(
					'expression_compound',
					f('expression_0', 'identifier'),
				),
				s(
					'expression_compound',
					f('expression_0', 'identifier'),
					f('property_accessor_0', 'property_accessor', s('integer')),
				),
				s(
					'expression_compound',
					f('expression_0', 'identifier'),
					f('property_accessor_0', 'property_accessor', s('integer')),
				),
				s(
					'expression_compound',
					f('expression_0', 'identifier'),
					f('property_accessor_0', 'property_accessor', s('natural')),
				),
				s(
					'expression_compound',
					f('expression_0', 'identifier'),
					f('property_accessor_0', 'property_accessor', s('integer')),
				),
				s(
					'expression_compound',
					f('expression_0', 'identifier'),
					f('property_accessor_0', 'property_accessor', s('integer')),
				),
				s(
					'expression_compound',
					f('expression_0', 'identifier'),
					f('property_accessor_0', 'property_accessor', s('word', s('identifier'))),
				),
				s(
					'expression_compound',
					f('expression_0', 'identifier'),
					f('property_accessor_0', 'property_accessor', s('word', s('identifier'))),
				),
				s(
					'expression_compound',
					f('expression_0', 'identifier'),
					f('property_accessor_0', 'property_accessor', s('word', s('identifier'))),
				),
				s(
					'expression_compound',
					f('expression_0', 'identifier'),
					f('property_accessor_0', 'property_accessor', s('word')),
				),
				s(
					'expression_compound',
					f('expression_0', 'identifier'),
					f('property_accessor_0', 'property_accessor', s('identifier')),
				),
				s(
					'expression_compound',
					f('expression_0', 'identifier'),
					f('property_accessor_0', 'property_accessor', s('identifier')),
				),
				s(
					'expression_compound',
					f('expression_0', 'identifier'),
					f('property_accessor_0', 'property_accessor', s('identifier')),
				),
				s(
					'expression_compound',
					f('expression_0', 'identifier'),
					f('function_arguments_0', 'function_arguments'),
				),
				s(
					'expression_compound',
					f('expression_0', 'identifier'),
					f('function_arguments_0', 'function_arguments', s('identifier')),
				),
				s(
					'expression_compound',
					f('expression_0', 'identifier'),
					f('generic_arguments_0', 'generic_arguments', s('identifier')),
					f('function_arguments_0', 'function_arguments'),
				),
				s(
					'expression_compound',
					f('expression_0', 'identifier'),
					f('property_accessor_0', 'property_accessor', s('word')),
				),
				s(
					'expression_compound',
					f('expression_0', 'identifier'),
					f('property_accessor_0', 'property_accessor', s('word', s('keyword_type'))),
				),
				s(
					'expression_compound',
					f('expression_0', 'identifier'),
					f('property_accessor_0', 'property_accessor', s('word', s('keyword_value'))),
				),
			),
		],

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
					f('expression_0', 'identifier'),
					f('expression_1', 'identifier'),
				),
				s(
					'expression_cast',
					f('expression_0', 'identifier'),
					f('expression_1', 'identifier'),
				),
				s(
					'expression_cast',
					f('expression_0', 'identifier'),
					f('expression_1', 'identifier'),
				),
				s(
					'expression_cast',
					f('expression_0', 'identifier'),
					f('type_0',       'identifier'),
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
					a !is b;
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
					s('expression_set_literal', s('identifier')),
					s('expression_set_literal', s('identifier')),
				),
				s(
					'expression_conditional',
					s('identifier'),
					s('expression_grouped', s('expression_set_literal', s('identifier'))),
					s('expression_grouped', s('expression_set_literal', s('identifier'))),
				),
				s(
					'expression_conditional',
					s('identifier'),
					s('expression_grouped', s('expression_block', s('statement_expression', s('identifier')))),
					s('expression_grouped', s('expression_block', s('statement_expression', s('identifier')))),
				),
			),
		],

		ExpressionSwitch: [
			xjs.String.dedent`
				{
					switch a default z;
					switch a case b -> g default z;
					switch a case b -> d case e -> g default z;
					switch a case b | c -> d case e | f -> g default z;
				}
			`,
			sourceExpressions(
				s(
					'expression_switch',
					f('expression_0', 'identifier'),
					f('expression_1', 'identifier'),
				),
				s(
					'expression_switch',
					f('expression_0', 'identifier'),
					s('case_switch', s('identifier'), s('identifier')),
					f('expression_1', 'identifier'),
				),
				s(
					'expression_switch',
					f('expression_0', 'identifier'),
					s('case_switch', s('identifier'), s('identifier')),
					s('case_switch', s('identifier'), s('identifier')),
					f('expression_1', 'identifier'),
				),
				s(
					'expression_switch',
					f('expression_0', 'identifier'),
					s('case_switch', s('identifier'), s('identifier'), s('identifier')),
					s('case_switch', s('identifier'), s('identifier'), s('identifier')),
					f('expression_1', 'identifier'),
				),
			),
		],

		ExpressionFunction: [
			xjs.String.dedent`
				{
					\\(): void {;};
					\\(a: A, $b: B, c= charlie: C): void { return; };
					\\(): bool { return true; };
					\\(): bool => false;
				}
			`,
			sourceExpressions(
				s(
					'expression_function',
					f('block_0', 'block__return', s('statement_expression__return')),
				),
				s(
					'expression_function',
					s(
						'parameter_function',
						f('identifier_0', 'identifier'),
						f('type_0',       'identifier'),
					),
					s(
						'parameter_function__named',
						f('identifier_0', 'identifier'),
						f('type_0',       'identifier'),
					),
					s(
						'parameter_function__named',
						f('word_0',       'word', s('identifier')),
						f('identifier_0', 'identifier'),
						f('type_0',       'identifier'),
					),
					f('block_0', 'block__return', s('statement_return')),
				),
				s(
					'expression_function',
					f('type_0', 'keyword_type'),
					f('block_0', 'block__return', s('statement_return', f('expression_0', 'primitive_literal', s('keyword_value')))),
				),
				s(
					'expression_function',
					f('type_0', 'keyword_type'),
					f('expression_0', 'primitive_literal', s('keyword_value')),
				),
			),
		],

		// Expression
		// consists of #Expression{Disjunctive,Conditional,Switch,Function}


		/* ## Statements */
		// Assignee
		// tested in #Statement{Claim,Set,Delete}

		StatementExpression: [
			xjs.String.dedent`
				{
					my_var;
				}
			`,
			sourceStatements(s('statement_expression', s('identifier'))),
		],

		StatementClaim: [
			xjs.String.dedent`
				{
					claim my_var:       T;
					claim tuple.1:      U;
					claim record.prop:  V;
					claim record._:     X;
					claim list.[index]: W;
					claim record.type:  Y;
					claim record.bool:  Z;
					claim record.true:  S;
				}
			`,
			sourceStatements(
				s(
					'statement_claim',
					s(
						'assignee',
						f('identifier_0', 'identifier'),
					),
					s('identifier'),
				),
				s(
					'statement_claim',
					s(
						'assignee',
						f('expression_0', 'identifier'),
						f('property_accessor_0', 'property_accessor', s('integer')),
					),
					s('identifier'),
				),
				s(
					'statement_claim',
					s(
						'assignee',
						f('expression_0', 'identifier'),
						f('property_accessor_0', 'property_accessor', s('word', s('identifier'))),
					),
					s('identifier'),
				),
				s(
					'statement_claim',
					s(
						'assignee',
						f('expression_0', 'identifier'),
						f('property_accessor_0', 'property_accessor', s('word')),
					),
					s('identifier'),
				),
				s(
					'statement_claim',
					s(
						'assignee',
						f('expression_0', 'identifier'),
						f('property_accessor_0', 'property_accessor', s('identifier')),
					),
					s('identifier'),
				),
				s(
					'statement_claim',
					s(
						'assignee',
						f('expression_0', 'identifier'),
						f('property_accessor_0', 'property_accessor', s('word')),
					),
					s('identifier'),
				),
				s(
					'statement_claim',
					s(
						'assignee',
						f('expression_0', 'identifier'),
						f('property_accessor_0', 'property_accessor', s('word', s('keyword_type'))),
					),
					s('identifier'),
				),
				s(
					'statement_claim',
					s(
						'assignee',
						f('expression_0', 'identifier'),
						f('property_accessor_0', 'property_accessor', s('word', s('keyword_value'))),
					),
					s('identifier'),
				),
			),
		],

		StatementSet: [
			xjs.String.dedent`
				{
					set my_var       = a;
					set tuple.1      = b;
					set record.prop  = c;
					set record._     = c;
					set list.[index] = d;
					set record.type  = 1;
					set record.bool  = 2;
					set record.true  = 3;
				}
			`,
			sourceStatements(
				s(
					'statement_set',
					s(
						'assignee',
						f('identifier_0', 'identifier'),
					),
					s('identifier'),
				),
				s(
					'statement_set',
					s(
						'assignee',
						f('expression_0', 'identifier'),
						f('property_accessor_0', 'property_accessor', s('integer')),
					),
					s('identifier'),
				),
				s(
					'statement_set',
					s(
						'assignee',
						f('expression_0', 'identifier'),
						f('property_accessor_0', 'property_accessor', s('word', s('identifier'))),
					),
					s('identifier'),
				),
				s(
					'statement_set',
					s(
						'assignee',
						f('expression_0', 'identifier'),
						f('property_accessor_0', 'property_accessor', s('word')),
					),
					s('identifier'),
				),
				s(
					'statement_set',
					s(
						'assignee',
						f('expression_0', 'identifier'),
						f('property_accessor_0', 'property_accessor', s('identifier')),
					),
					s('identifier'),
				),
				s(
					'statement_set',
					s(
						'assignee',
						f('expression_0', 'identifier'),
						f('property_accessor_0', 'property_accessor', s('word')),
					),
					s('primitive_literal', s('integer')),
				),
				s(
					'statement_set',
					s(
						'assignee',
						f('expression_0', 'identifier'),
						f('property_accessor_0', 'property_accessor', s('word', s('keyword_type'))),
					),
					s('primitive_literal', s('integer')),
				),
				s(
					'statement_set',
					s(
						'assignee',
						f('expression_0', 'identifier'),
						f('property_accessor_0', 'property_accessor', s('word', s('keyword_value'))),
					),
					s('primitive_literal', s('integer')),
				),
			),
		],

		StatementDelete: [
			xjs.String.dedent`
				{
					delete my_var;
					delete tuple.1;
					delete record.prop;
					delete record._;
					delete list.[index];
					delete record.type;
					delete record.bool;
					delete record.true;
				}
			`,
			sourceStatements(
				s(
					'statement_delete',
					s(
						'assignee',
						f('identifier_0', 'identifier'),
					),
				),
				s(
					'statement_delete',
					s(
						'assignee',
						f('expression_0', 'identifier'),
						f('property_accessor_0', 'property_accessor', s('integer')),
					),
				),
				s(
					'statement_delete',
					s(
						'assignee',
						f('expression_0', 'identifier'),
						f('property_accessor_0', 'property_accessor', s('word', s('identifier'))),
					),
				),
				s(
					'statement_delete',
					s(
						'assignee',
						f('expression_0', 'identifier'),
						f('property_accessor_0', 'property_accessor', s('word')),
					),
				),
				s(
					'statement_delete',
					s(
						'assignee',
						f('expression_0', 'identifier'),
						f('property_accessor_0', 'property_accessor', s('identifier')),
					),
				),
				s(
					'statement_delete',
					s(
						'assignee',
						f('expression_0', 'identifier'),
						f('property_accessor_0', 'property_accessor', s('word')),
					),
				),
				s(
					'statement_delete',
					s(
						'assignee',
						f('expression_0', 'identifier'),
						f('property_accessor_0', 'property_accessor', s('word', s('keyword_type'))),
					),
				),
				s(
					'statement_delete',
					s(
						'assignee',
						f('expression_0', 'identifier'),
						f('property_accessor_0', 'property_accessor', s('word', s('keyword_value'))),
					),
				),
			),
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
				s('statement_conditional',         f('expression_0', 'identifier'), f('block_0', 'block', s('statement_expression', s('identifier')))),
				s('statement_conditional__unless', f('expression_0', 'identifier'), f('block_0', 'block', s('statement_expression', s('identifier')))),
				s(
					'statement_conditional',
					f('expression_0', 'identifier'),
					f('block_0', 'block', s('statement_expression', s('identifier'))),
					f('block_1', 'block', s('statement_expression', s('identifier'))),
				),
				s(
					'statement_conditional',
					f('expression_0', 'identifier'),
					f('block_0', 'block', s('statement_expression', s('identifier'))),
					f(
						'statement_conditional_0',
						'statement_conditional',
						f('expression_0', 'identifier'),
						f('block_0', 'block', s('statement_expression', s('identifier'))),
						f('block_1', 'block', s('statement_expression', s('identifier'))),
					),
				),
				s(
					'statement_conditional',
					f('expression_0', 'identifier'),
					f('block_0', 'block', s('statement_expression', s('identifier'))),
					f(
						'statement_conditional_0',
						'statement_conditional',
						f('expression_0', 'identifier'),
						f('block_0', 'block', s('statement_expression', s('identifier'))),
						f(
							'statement_conditional_0',
							'statement_conditional',
							f('expression_0', 'identifier'),
							f('block_0', 'block', s('statement_expression', s('identifier'))),
							f('block_1', 'block', s('statement_expression', s('identifier'))),
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
					while condition do {
						if condition then { consequent; };
					};
				}
			`,
			sourceStatements(
				s('statement_loop', f('expression_0', 'identifier'), f('block_0', 'block__break', s('statement_expression__break', s('identifier')))),
				s('statement_loop', f('expression_0', 'identifier'), f('block_0', 'block__break', s('statement_expression__break', s('identifier')))),
				s('statement_loop', f('block_0', 'block__break', s('statement_expression__break', s('identifier'))), f('expression_0', 'identifier')),
				s('statement_loop', f('block_0', 'block__break', s('statement_expression__break', s('identifier'))), f('expression_0', 'identifier')),
				s('statement_loop', f('expression_0', 'identifier'), f(
					'block_0',
					'block__break',
					s('statement_conditional__break', f('expression_0', 'identifier'), f('block_0', 'block__break', s('statement_expression__break', s('identifier')))),
				)),
			),
		],

		StatementIteration: [
			xjs.String.dedent`
				{
					for _:  T in iterable do { iterate; };
					for it: T in iterable do { iterate; };
				}
			`,
			sourceStatements(
				s('statement_iteration',                                  f('type_0', 'identifier'), f('expression_0', 'identifier'), f('block_0', 'block__break', s('statement_expression__break', s('identifier')))),
				s('statement_iteration', f('identifier_0', 'identifier'), f('type_0', 'identifier'), f('expression_0', 'identifier'), f('block_0', 'block__break', s('statement_expression__break', s('identifier')))),
			),
		],

		StatementBreak: [
			xjs.String.dedent`
				{
					while condition do {
						break;
						skip;
					};
				}
			`,
			sourceStatements(s('statement_loop', f('expression_0', 'identifier'), f(
				'block_0',
				'block__break',
				s('statement_break'),
				s('statement_break'),
			))),
		],

		// StatementReturn
		// tested in #{Expression,Declaration}Function

		// Statement
		// consists of #{Declaration,Statement{Expression,Claim,Set,Delete,Conditional,Loop,Iteration,Break,Return}}

		Block: [
			xjs.String.dedent`
				{
					type T = U;
					val a: T = b;
					a;
					claim a: U;
					set a = b;
					delete a;
					{
						b;
					};
					if condition then { consequent; };
					while condition do { loop; };
					for it: T in iterable do { iterate; };
				}
			`,
			sourceStatements(
				s(
					'declaration_type',
					f('identifier_0', 'identifier'),
					f('type_0',       'identifier'),
				),
				s(
					'declaration_variable',
					f('identifier_0', 'identifier'),
					f('type_0',       'identifier'),
					f('expression_0', 'identifier'),
				),
				s(
					'statement_expression',
					s('identifier'),
				),
				s(
					'statement_claim',
					s(
						'assignee',
						f('identifier_0', 'identifier'),
					),
					s('identifier'),
				),
				s(
					'statement_set',
					s(
						'assignee',
						f('identifier_0', 'identifier'),
					),
					s('identifier'),
				),
				s(
					'statement_delete',
					s(
						'assignee',
						f('identifier_0', 'identifier'),
					),
				),
				s(
					'statement_expression',
					s('expression_block', s('statement_expression', s('identifier'))),
				),
				s('statement_conditional',                                                             f('expression_0', 'identifier'), f('block_0', 'block',        s('statement_expression',        s('identifier')))),
				s('statement_loop',                                                                    f('expression_0', 'identifier'), f('block_0', 'block__break', s('statement_expression__break', s('identifier')))),
				s('statement_iteration',   f('identifier_0', 'identifier'), f('type_0', 'identifier'), f('expression_0', 'identifier'), f('block_0', 'block__break', s('statement_expression__break', s('identifier')))),
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
					f('identifier_0', 'identifier'),
					f(
						'type_0',
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
					f('identifier_0', 'identifier'),
					f('type_0',       'identifier'),
				),
				s(
					'declaration_type',
					f('type_0', 'identifier'),
				),
			),
		],

		DeclarationVariable: [
			xjs.String.dedent`
				{
					val v: T = a + b * c;
					val mut u: A | B & C = v;
					val 'å': A = a;
					val mut 'é': E = e;
					val _: T = v;
					val mut uninit?: T;
					val v = f;
					val mut v = g;
				}
			`,
			sourceStatements(
				s(
					'declaration_variable',
					f('identifier_0', 'identifier'),
					f('type_0',       'identifier'),
					f(
						'expression_0',
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
					f('identifier_0', 'identifier'),
					f(
						'type_0',
						'type_union',
						s('identifier'),
						s(
							'type_intersection',
							s('identifier'),
							s('identifier'),
						),
					),
					f('expression_0', 'identifier'),
				),
				s(
					'declaration_variable',
					f('identifier_0', 'identifier'),
					f('type_0',       'identifier'),
					f('expression_0', 'identifier'),
				),
				s(
					'declaration_variable',
					f('identifier_0', 'identifier'),
					f('type_0',       'identifier'),
					f('expression_0', 'identifier'),
				),
				s(
					'declaration_variable',
					f('type_0',       'identifier'),
					f('expression_0', 'identifier'),
				),
				s(
					'declaration_variable',
					f('identifier_0', 'identifier'),
					f('type_0',       'identifier'),
				),
				s(
					'declaration_variable',
					f('identifier_0', 'identifier'),
					f('expression_0', 'identifier'),
				),
				s(
					'declaration_variable',
					f('identifier_0', 'identifier'),
					f('expression_0', 'identifier'),
				),
			),
		],

		DeclarationFunction: [
			xjs.String.dedent`
				{
					func _(): void {;}
					func foo(): void {;}
					func foo(a: A, $b: B, c= charlie: C): void { return; }
					func foo(): bool { return true; }
					func foo(): bool => false;
				}
			`,
			sourceStatements(
				s(
					'declaration_function',
					f('block_0', 'block__return', s('statement_expression__return')),
				),
				s(
					'declaration_function',
					f('identifier_0', 'identifier'),
					f('block_0', 'block__return', s('statement_expression__return')),
				),
				s(
					'declaration_function',
					f('identifier_0', 'identifier'),
					s(
						'parameter_function',
						f('identifier_0', 'identifier'),
						f('type_0',       'identifier'),
					),
					s(
						'parameter_function__named',
						f('identifier_0', 'identifier'),
						f('type_0',       'identifier'),
					),
					s(
						'parameter_function__named',
						f('word_0',       'word', s('identifier')),
						f('identifier_0', 'identifier'),
						f('type_0',       'identifier'),
					),
					f('block_0', 'block__return', s('statement_return')),
				),
				s(
					'declaration_function',
					f('identifier_0', 'identifier'),
					f('type_0', 'keyword_type'),
					f('block_0', 'block__return', s('statement_return', f('expression_0', 'primitive_literal', s('keyword_value')))),
				),
				s(
					'declaration_function',
					f('identifier_0', 'identifier'),
					f('type_0', 'keyword_type'),
					f('expression_0', 'primitive_literal', s('keyword_value')),
				),
			),
		],

		// Declaration
		// consists of #Declaration{Type,Variable,Function}
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
