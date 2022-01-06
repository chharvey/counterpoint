import * as fs from 'fs';
import * as path from 'path';



const DIRNAME = path.dirname(new URL(import.meta.url).pathname);
const BOT_TYPE = 'type_unit';
const TOP_TYPE = 'type';
const BOT_EXPR = 'expression_unit';
const TOP_EXPR = 'expression';

const hierarchy_type = [
	BOT_TYPE,
	'type_compound',
	'type_unary_symbol',
	'type_unary_keyword',
	'type_intersection',
	'type_union',
	TOP_TYPE,
];

const hierarchy_expr = [
	BOT_EXPR,
	'expression_compound',
	'expression_unary_symbol',
	'expression_exponential',
	'expression_multiplicative',
	'expression_additive',
	'expression_comparative',
	'expression_equality',
	'expression_conjunctive',
	'expression_disjunctive',
	TOP_EXPR,
];



function s(name, ...operands) {
	return `
		(${ name }
			${ operands.join('\n\t\t\t') }
		)
	`;
}

function fromTypeUnit(name, primary) {
	if (name === BOT_TYPE) {
		return s(name, primary);
	}
	const child = hierarchy_type.includes(name) ? hierarchy_type[hierarchy_type.indexOf(name) - 1] : BOT_TYPE;
	return s(name, fromTypeUnit(child, primary));
}

function toType(name, ...operands) {
	const typ = s(name, ...operands);
	if (name === TOP_TYPE) {
		return typ;
	}
	const parent = hierarchy_type.includes(name) ? hierarchy_type[hierarchy_type.indexOf(name) + 1] : TOP_TYPE;
	return toType(parent, typ);
}

function fromUnit(name, primary) {
	if (name === BOT_EXPR) {
		return s(name, primary);
	}
	const child = hierarchy_expr.includes(name) ? hierarchy_expr[hierarchy_expr.indexOf(name) - 1] : BOT_EXPR;
	return s(name, fromUnit(child, primary));
}

function toExpression(name, ...operands) {
	const exp = s(name, ...operands);
	if (name === TOP_EXPR) {
		return exp;
	}
	const parent = hierarchy_expr.includes(name) ? hierarchy_expr[hierarchy_expr.indexOf(name) + 1] : TOP_EXPR;
	return toExpression(parent, exp);
}

function extractType(operand) {
	return toExpression('expression_compound',
		fromUnit('expression_compound', s('identifier')),
		s('function_call',
			s('generic_arguments', operand),
			s('function_arguments'),
		),
	);
}

function makeSourceFile(...expressions) {
	return s('source_file',
		expressions.map((expr) => s('statement', expr)).join(''),
	);
}



function buildTest(title, source, expected) {
	return `
${ '='.repeat(title.length) }
${ title }
${ '='.repeat(title.length) }

${ source }

---

${ expected }
	`;
}



await fs.promises.writeFile(path.join(DIRNAME, `../test/corpus/index.txt`), Object.entries({
	/* # TERMINALS */
	KEYWORDTYPE: [`
		f.<void>();
		f.<bool>();
		f.<int>();
		f.<float>();
		f.<str>();
		f.<obj>();
	`, makeSourceFile(
		extractType(fromTypeUnit('type', s('keyword_type'))),
		extractType(fromTypeUnit('type', s('keyword_type'))),
		extractType(fromTypeUnit('type', s('keyword_type'))),
		extractType(fromTypeUnit('type', s('keyword_type'))),
		extractType(fromTypeUnit('type', s('keyword_type'))),
		extractType(fromTypeUnit('type', s('keyword_type'))),
	)],

	KEYWORDVALUE: [`
		null;
		false;
		true;
	`, makeSourceFile(
		fromUnit('expression', s('primitive_literal', s('keyword_value'))),
		fromUnit('expression', s('primitive_literal', s('keyword_value'))),
		fromUnit('expression', s('primitive_literal', s('keyword_value'))),
	)],

	IDENTIFIER: [`
		my_variable;
	`, makeSourceFile(
		fromUnit('expression', s('identifier')),
	)],

	INTEGER: [`
		42;
		\\b01000101;
		4_2;
		\\b0100_0101;
	`, makeSourceFile(
		fromUnit('expression', s('primitive_literal', s('integer'))),
		fromUnit('expression', s('primitive_literal', s('integer__radix'))),
		fromUnit('expression', s('primitive_literal', s('integer__separator'))),
		fromUnit('expression', s('primitive_literal', s('integer__radix__separator'))),
	)],

	FLOAT: [`
		42.;
		42.69;
		42.69e15;
		42.69e+15;
		42.69e-15;
		4_2.;
		4_2.6_9;
		4_2.6_9e1_5;
		4_2.6_9e+1_5;
		4_2.6_9e-1_5;
	`, makeSourceFile(
		fromUnit('expression', s('primitive_literal', s('float'))),
		fromUnit('expression', s('primitive_literal', s('float'))),
		fromUnit('expression', s('primitive_literal', s('float'))),
		fromUnit('expression', s('primitive_literal', s('float'))),
		fromUnit('expression', s('primitive_literal', s('float'))),
		fromUnit('expression', s('primitive_literal', s('float__separator'))),
		fromUnit('expression', s('primitive_literal', s('float__separator'))),
		fromUnit('expression', s('primitive_literal', s('float__separator'))),
		fromUnit('expression', s('primitive_literal', s('float__separator'))),
		fromUnit('expression', s('primitive_literal', s('float__separator'))),
	)],

	STRING: [`
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
	`, makeSourceFile(
		fromUnit('expression', s('primitive_literal', s('string'))),
		fromUnit('expression', s('primitive_literal', s('string'))),
		fromUnit('expression', s('primitive_literal', s('string'))),
		fromUnit('expression', s('primitive_literal', s('string'))),
		fromUnit('expression', s('primitive_literal', s('string'))),
		fromUnit('expression', s('primitive_literal', s('string'))),
		fromUnit('expression', s('primitive_literal', s('string__separator'))),
	)],

	TEMPLATE: [`
		'''hello {{ to }} the
		the {{ big }} world''';

		'''hello {{ to }} the {{ whole }} great {{ big }} world''';

		'''hello {{ '''to {{ '''the
		the''' }} big''' }} world''';
	`, makeSourceFile(
		fromUnit('expression', s('string_template',
			s('template_head'),
			fromUnit('expression', s('identifier')),
			s('template_middle'),
			fromUnit('expression', s('identifier')),
			s('template_tail'),
		)),
		fromUnit('expression', s('string_template',
			s('template_head'),
			fromUnit('expression', s('identifier')),
			s('template_middle'),
			fromUnit('expression', s('identifier')),
			s('template_middle'),
			fromUnit('expression', s('identifier')),
			s('template_tail'),
		)),
		fromUnit('expression', s('string_template',
			s('template_head'),
			fromUnit('expression', s('string_template',
				s('template_head'),
				fromUnit('expression', s('string_template',
					s('template_full'),
				)),
				s('template_tail'),
			)),
			s('template_tail'),
		)),
	)],



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

	TypeTupleLiteral: [`
		f.<[bool, int, ?: str]>();
	`, makeSourceFile(
		extractType(fromTypeUnit('type', s('type_tuple_literal', s('items_type',
			s('entry_type',           fromTypeUnit('type', s('keyword_type'))),
			s('entry_type',           fromTypeUnit('type', s('keyword_type'))),
			s('entry_type__optional', fromTypeUnit('type', s('keyword_type'))),
		)))),
	)],

	TypeRecordLiteral: [`
		f.<[a: bool, b?: int, c: str]>();
	`, makeSourceFile(
		extractType(fromTypeUnit('type', s('type_record_literal', s('properties_type',
			s('entry_type__named',           s('word', s('identifier')), fromTypeUnit('type', s('keyword_type'))),
			s('entry_type__named__optional', s('word', s('identifier')), fromTypeUnit('type', s('keyword_type'))),
			s('entry_type__named',           s('word', s('identifier')), fromTypeUnit('type', s('keyword_type'))),
		)))),
	)],

	TypeHashLiteral: [`
		f.<[: bool]>();
	`, makeSourceFile(
		extractType(fromTypeUnit('type', s('type_hash_literal',
			fromTypeUnit('type', s('keyword_type')),
		))),
	)],

	TypeMapLiteral: [`
		f.<{int -> float}>();
	`, makeSourceFile(
		extractType(fromTypeUnit('type', s('type_map_literal',
			fromTypeUnit('type', s('keyword_type')),
			fromTypeUnit('type', s('keyword_type')),
		))),
	)],

	TypeUnit: [`
		f.<(T)>();
	`, makeSourceFile(
		extractType(fromTypeUnit('type', fromTypeUnit('type', s('identifier')))),
	)],

	// PropertyAccessType
	// see #TypeCompound

	// GenericCall
	// see #TypeCompound

	TypeCompound: [`
		f.<TupleType.0>();
		f.<RecordType.prop>();
		f.<Set.<T>>();
	`, makeSourceFile(
		extractType(toType('type_compound',
			fromTypeUnit('type_compound', s('identifier')),
			s('property_access_type', s('integer')),
		)),
		extractType(toType('type_compound',
			fromTypeUnit('type_compound', s('identifier')),
			s('property_access_type', s('word', s('identifier'))),
		)),
		extractType(toType('type_compound',
			fromTypeUnit('type_compound', s('identifier')),
			s('generic_call',
				s('generic_arguments',
					fromTypeUnit('type', s('identifier')),
				),
			),
		)),
	)],

	TypeUnarySymbol: [`
		f.<T?>();
		f.<T!>();
		f.<T[]>();
		f.<T[3]>();
		f.<T{}>();
	`, makeSourceFile(
		extractType(toType('type_unary_symbol',
			fromTypeUnit('type_unary_symbol', s('identifier')),
		)),
		extractType(toType('type_unary_symbol',
			fromTypeUnit('type_unary_symbol', s('identifier')),
		)),
		extractType(toType('type_unary_symbol',
			fromTypeUnit('type_unary_symbol', s('identifier')),
		)),
		extractType(toType('type_unary_symbol',
			fromTypeUnit('type_unary_symbol', s('identifier')),
			s('integer'),
		)),
		extractType(toType('type_unary_symbol',
			fromTypeUnit('type_unary_symbol', s('identifier')),
		)),
	)],

	TypeUnaryKeyword: [`
		f.<mutable T>();
	`, makeSourceFile(
		extractType(toType('type_unary_keyword',
			fromTypeUnit('type_unary_keyword', s('identifier')),
		)),
	)],

	TypeIntersection: [`
		f.<T & U>();
	`, makeSourceFile(
		extractType(toType('type_intersection',
			fromTypeUnit('type_intersection',  s('identifier')),
			fromTypeUnit('type_unary_keyword', s('identifier')),
		)),
	)],

	TypeUnion: [`
		f.<T | U>();
	`, makeSourceFile(
		extractType(toType('type_union',
			fromTypeUnit('type_union',        s('identifier')),
			fromTypeUnit('type_intersection', s('identifier')),
		)),
	)],

	// Type
	// see #TypeUnion


	/* ## Expressions */
	// StringTemplate
	// see #TEMPLATE

	// Property
	// see #RecordLiteral

	// Case
	// see #MapLiteral

	TupleLiteral: [`
		[1, 2, 3];
	`, makeSourceFile(
		fromUnit('expression', s('tuple_literal',
			fromUnit('expression', s('primitive_literal', s('integer'))),
			fromUnit('expression', s('primitive_literal', s('integer'))),
			fromUnit('expression', s('primitive_literal', s('integer'))),
		)),
	)],

	RecordLiteral: [`
		[a= 1, b= 2, c= 3];
	`, makeSourceFile(
		fromUnit('expression', s('record_literal',
			s('property',
				s('word', s('identifier')),
				fromUnit('expression', s('primitive_literal', s('integer'))),
			),
			s('property',
				s('word', s('identifier')),
				fromUnit('expression', s('primitive_literal', s('integer'))),
			),
			s('property',
				s('word', s('identifier')),
				fromUnit('expression', s('primitive_literal', s('integer'))),
			),
		)),
	)],

	SetLiteral: [`
		{1, 2, 3};
	`, makeSourceFile(
		fromUnit('expression', s('set_literal',
			fromUnit('expression', s('primitive_literal', s('integer'))),
			fromUnit('expression', s('primitive_literal', s('integer'))),
			fromUnit('expression', s('primitive_literal', s('integer'))),
		)),
	)],

	MapLiteral: [`
		{'1' -> 1, '2' -> 2, '3' -> 3};
	`, makeSourceFile(
		fromUnit('expression', s('map_literal',
			s('case',
				fromUnit('expression', s('primitive_literal', s('string'))),
				fromUnit('expression', s('primitive_literal', s('integer'))),
			),
			s('case',
				fromUnit('expression', s('primitive_literal', s('string'))),
				fromUnit('expression', s('primitive_literal', s('integer'))),
			),
			s('case',
				fromUnit('expression', s('primitive_literal', s('string'))),
				fromUnit('expression', s('primitive_literal', s('integer'))),
			),
		)),
	)],

	// FunctionArguments
	// see #FunctionCall

	ExpressionUnit: [`
		(a);
	`, makeSourceFile(
		fromUnit('expression', fromUnit('expression', s('identifier'))),
	)],

	// PropertyAccess
	// see #ExpressionCompound

	// PropertyAssign
	// see #Assignee

	// FunctionCall
	// see #ExpressionCompound

	ExpressionCompound: [`
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
	`, makeSourceFile(
		toExpression('expression_compound',
			fromUnit('expression_compound', s('identifier')),
			s('property_access', s('integer')),
		),
		toExpression('expression_compound',
			fromUnit('expression_compound', s('identifier')),
			s('property_access', s('integer')),
		),
		toExpression('expression_compound',
			fromUnit('expression_compound', s('identifier')),
			s('property_access', s('integer')),
		),
		toExpression('expression_compound',
			fromUnit('expression_compound', s('identifier')),
			s('property_access', s('word', s('identifier'))),
		),
		toExpression('expression_compound',
			fromUnit('expression_compound', s('identifier')),
			s('property_access', s('word', s('identifier'))),
		),
		toExpression('expression_compound',
			fromUnit('expression_compound', s('identifier')),
			s('property_access', s('word', s('identifier'))),
		),
		toExpression('expression_compound',
			fromUnit('expression_compound', s('identifier')),
			s('property_access', fromUnit('expression', s('identifier'))),
		),
		toExpression('expression_compound',
			fromUnit('expression_compound', s('identifier')),
			s('property_access', fromUnit('expression', s('identifier'))),
		),
		toExpression('expression_compound',
			fromUnit('expression_compound', s('identifier')),
			s('property_access', fromUnit('expression', s('identifier'))),
		),
		toExpression('expression_compound',
			fromUnit('expression_compound', s('identifier')),
			s('function_call', s('function_arguments')),
		),
		toExpression('expression_compound',
			fromUnit('expression_compound', s('identifier')),
			s('function_call',
				s('function_arguments',
					fromUnit('expression', s('tuple_literal'))
				),
			),
		),
		toExpression('expression_compound',
			fromUnit('expression_compound', s('identifier')),
			s('function_call',
				s('generic_arguments',
					fromTypeUnit('type', s('identifier')),
				),
				s('function_arguments'),
			),
		),
	)],

	// Assignee
	// see #StatementAssignment

	ExpressionUnarySymbol: [`
		!value;
		?value;
		+value;
		-value;
	`, makeSourceFile(
		toExpression('expression_unary_symbol',
			fromUnit('expression_unary_symbol', s('identifier')),
		),
		toExpression('expression_unary_symbol',
			fromUnit('expression_unary_symbol', s('identifier')),
		),
		toExpression('expression_unary_symbol',
			fromUnit('expression_unary_symbol', s('identifier')),
		),
		toExpression('expression_unary_symbol',
			fromUnit('expression_unary_symbol', s('identifier')),
		),
	)],

	ExpressionExponential: [`
		a ^ b;
		a ^ b ^ c;
	`, makeSourceFile(
		toExpression('expression_exponential',
			fromUnit('expression_unary_symbol', s('identifier')),
			fromUnit('expression_exponential',  s('identifier')),
		),
		toExpression('expression_exponential',
			fromUnit('expression_unary_symbol', s('identifier')),
			s('expression_exponential',
				fromUnit('expression_unary_symbol', s('identifier')),
				fromUnit('expression_exponential',  s('identifier')),
			),
		),
	)],

	ExpressionMultiplicative: [`
		a * b;
		a / b;
		a * b * c;
	`, makeSourceFile(
		toExpression('expression_multiplicative',
			fromUnit('expression_multiplicative', s('identifier')),
			fromUnit('expression_exponential',    s('identifier')),
		),
		toExpression('expression_multiplicative',
			fromUnit('expression_multiplicative', s('identifier')),
			fromUnit('expression_exponential',    s('identifier')),
		),
		toExpression('expression_multiplicative',
			s('expression_multiplicative',
				fromUnit('expression_multiplicative', s('identifier')),
				fromUnit('expression_exponential',    s('identifier')),
			),
			fromUnit('expression_exponential', s('identifier')),
		),
	)],

	ExpressionAdditive: [`
		a + b;
		a - b;
	`, makeSourceFile(
		toExpression('expression_additive',
			fromUnit('expression_additive',       s('identifier')),
			fromUnit('expression_multiplicative', s('identifier')),
		),
		toExpression('expression_additive',
			fromUnit('expression_additive',       s('identifier')),
			fromUnit('expression_multiplicative', s('identifier')),
		),
	)],

	ExpressionComparative: [`
		a < b;
		a > b;
		a <= b;
		a >= b;
		a !< b;
		a !> b;
		a is b;
		a isnt b;
	`, makeSourceFile(
		toExpression('expression_comparative',
			fromUnit('expression_comparative', s('identifier')),
			fromUnit('expression_additive',    s('identifier')),
		),
		toExpression('expression_comparative',
			fromUnit('expression_comparative', s('identifier')),
			fromUnit('expression_additive',    s('identifier')),
		),
		toExpression('expression_comparative',
			fromUnit('expression_comparative', s('identifier')),
			fromUnit('expression_additive',    s('identifier')),
		),
		toExpression('expression_comparative',
			fromUnit('expression_comparative', s('identifier')),
			fromUnit('expression_additive',    s('identifier')),
		),
		toExpression('expression_comparative',
			fromUnit('expression_comparative', s('identifier')),
			fromUnit('expression_additive',    s('identifier')),
		),
		toExpression('expression_comparative',
			fromUnit('expression_comparative', s('identifier')),
			fromUnit('expression_additive',    s('identifier')),
		),
		toExpression('expression_comparative',
			fromUnit('expression_comparative', s('identifier')),
			fromUnit('expression_additive',    s('identifier')),
		),
		toExpression('expression_comparative',
			fromUnit('expression_comparative', s('identifier')),
			fromUnit('expression_additive',    s('identifier')),
		),
	)],

	ExpressionEquality: [`
		a === b;
		a !== b;
		a == b;
		a !== b;
	`, makeSourceFile(
		toExpression('expression_equality',
			fromUnit('expression_equality',    s('identifier')),
			fromUnit('expression_comparative', s('identifier')),
		),
		toExpression('expression_equality',
			fromUnit('expression_equality',    s('identifier')),
			fromUnit('expression_comparative', s('identifier')),
		),
		toExpression('expression_equality',
			fromUnit('expression_equality',    s('identifier')),
			fromUnit('expression_comparative', s('identifier')),
		),
		toExpression('expression_equality',
			fromUnit('expression_equality',    s('identifier')),
			fromUnit('expression_comparative', s('identifier')),
		),
	)],

	ExpressionConjunctive: [`
		a && b;
		a !& b;
	`, makeSourceFile(
		toExpression('expression_conjunctive',
			fromUnit('expression_conjunctive', s('identifier')),
			fromUnit('expression_equality',    s('identifier')),
		),
		toExpression('expression_conjunctive',
			fromUnit('expression_conjunctive', s('identifier')),
			fromUnit('expression_equality',    s('identifier')),
		),
	)],

	ExpressionDisjunctive: [`
		a || b;
		a !| b;
	`, makeSourceFile(
		toExpression('expression_disjunctive',
			fromUnit('expression_disjunctive', s('identifier')),
			fromUnit('expression_conjunctive', s('identifier')),
		),
		toExpression('expression_disjunctive',
			fromUnit('expression_disjunctive', s('identifier')),
			fromUnit('expression_conjunctive', s('identifier')),
		),
	)],

	ExpressionConditional: [`
		if a then b else c;
	`, makeSourceFile(
		s('expression',
			s('expression_conditional',
				fromUnit('expression', s('identifier')),
				fromUnit('expression', s('identifier')),
				fromUnit('expression', s('identifier')),
			),
		),
	)],

	// Expression
	// see #Expression{Disjunctive,Conditional}


	/* ## Statements */
	DeclarationType: [`
		type T = A | B & C;
	`, s('source_file',
		s('statement', s('declaration', s('declaration_type',
			s('identifier'),
			toType('type_union',
				fromTypeUnit('type_union', s('identifier')),
				s('type_intersection',
					fromTypeUnit('type_intersection',  s('identifier')),
					fromTypeUnit('type_unary_keyword', s('identifier')),
				),
			),
		))),
	)],

	DeclarationVariable: [`
		let v: T = a + b * c;
		let unfixed u: A | B & C = v;
	`, s('source_file',
		s('statement', s('declaration', s('declaration_variable',
			s('identifier'),
			fromTypeUnit('type', s('identifier')),
			toExpression('expression_additive',
				fromUnit('expression_additive', s('identifier')),
				s('expression_multiplicative',
					fromUnit('expression_multiplicative', s('identifier')),
					fromUnit('expression_exponential',    s('identifier')),
				),
			),
		))),
		s('statement', s('declaration', s('declaration_variable',
			s('identifier'),
			toType('type_union',
				fromTypeUnit('type_union', s('identifier')),
				s('type_intersection',
					fromTypeUnit('type_intersection',  s('identifier')),
					fromTypeUnit('type_unary_keyword', s('identifier')),
				),
			),
			fromUnit('expression', s('identifier')),
		))),
	)],

	// Declaration
	// see #Declaration{Type,Variable}

	StatementAssignment: [`
		my_var       = a;
		tuple.1      = b;
		record.prop  = c;
		list.[index] = d;
	`, s('source_file',
		s('statement', s('statement_assignment',
			s('assignee',
				s('identifier'),
			),
			fromUnit('expression', s('identifier')),
		)),
		s('statement', s('statement_assignment',
			s('assignee',
				fromUnit('expression_compound', s('identifier')),
				s('property_assign', s('integer')),
			),
			fromUnit('expression', s('identifier')),
		)),
		s('statement', s('statement_assignment',
			s('assignee',
				fromUnit('expression_compound', s('identifier')),
				s('property_assign', s('word', s('identifier'))),
			),
			fromUnit('expression', s('identifier')),
		)),
		s('statement', s('statement_assignment',
			s('assignee',
				fromUnit('expression_compound', s('identifier')),
				s('property_assign', fromUnit('expression', s('identifier'))),
			),
			fromUnit('expression', s('identifier')),
		)),
	)],

	Statement: [`
		;
	`, s('source_file', s('statement'))],
}).map(([title, [source, expected]]) => buildTest(title, source, expected)).filter((test) => !!test).join(''));
