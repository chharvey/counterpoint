/**
 * @file Tree-sitter parser for the Counterpoint Programming Language.
 * @author Chris Harvey <1362083+chharvey@users.noreply.github.com>
 * @license GPL-3.0-or-later
 */

/// <reference types="tree-sitter-cli/dsl.d.ts"/>



function argsArr(nth: number, params: readonly string[]): string[] {
	// e.g. `['await', 'static', 'instance', 'method']`
	return [...nth.toString(2).padStart(params.length, '0')] // e.g. (if `nth` is 5 out of 15) `['0', '1', '0', '1']`
		.map<[string, boolean]>((bit, i) => [params[i], !!+bit]) // `[['await', false],  ['static', true],  ['instance', false],  ['method', true]]`
		.filter(([_param, to_include]) => !!to_include)          // `[['static', true],  ['method', true]]`
		.map(([param, _to_include]) => param);                   // `['static', 'method']`
}
function familyName<RuleName extends string>(family_name: string, suffices: readonly string[]): RuleName {
	return family_name.concat((suffices.length) ? `__${ suffices.join('__') }` : '') as RuleName;
}
function familyNameAll<RuleName extends string>(family_name: string, params: readonly string[]): RuleName[] {
	return [...new Array<undefined>(2 ** params.length)].map((_, nth) => familyName(family_name, argsArr(nth, params)));
}

/**
 * Generate a list of productions from a set of parameters.
 * E.g., to generate the following EBNF production:
 * ```ebnf
 * NonTerminal<ParamA, ParamB, ParamC> ::= ItemA ItemB<+ParamA> ItemC<+ParamA><-ParamB> ItemD<+ParamA><+ParamB><?ParamC>;
 * ```
 * we can call:
 * ```js
 * parameterize(
 * 	'non_terminal',
 * 	({param_a, param_b, param_c}) => $ => seq(
 * 		$.item_a,
 * 		call($, 'item_b', 'param_a'),
 * 		call($, 'item_c', 'param_a'),                       // ignore false arguments
 * 		call($, 'item_d', {param_c}, 'param_a', 'param_b'), // `param_c` is inherited
 * 	),
 * 	'param_a', 'param_b', 'param_c',
 * )
 * ```
 * @param family_name        the name of the production without parameters
 * @param parameterized_rule a function returning a rule for the production
 * @param params             a set of stringified parameters
 * @returns                  an object of newly generated rules
 */
function parameterize<RuleName extends string, BaseGrammarRuleName extends string>(
	family_name: string,
	parameterized_rule: (args_obj: Readonly<Record<string, boolean>>) => RuleBuilder<RuleName>,
	...params: readonly string[]
): RuleBuilders<RuleName, BaseGrammarRuleName> {
	const rules_obj: RuleBuilders<RuleName, BaseGrammarRuleName> = {} as RuleBuilders<RuleName, BaseGrammarRuleName>;
	new Map<RuleName, RuleBuilder<RuleName>>([...new Array<undefined>(2 ** params.length)].map((_, nth) => {
		const args_arr: readonly string[] = argsArr(nth, params);
		const args_obj: Record<string, boolean> = {};
		args_arr.forEach((arg) => {
			args_obj[arg] = true;
		});
		return [
			familyName(family_name, args_arr),
			parameterized_rule.call(null, args_obj),
		];
	})).forEach((rule, name) => {
		rules_obj[name] = rule;
	});
	return rules_obj;
}

/**
 * References a production with arguments. Arguments must be provided in order.
 * E.g., to generate the following EBNF item:
 * ```ebnf
 * Item<+ParamA><+ParamB, +ParamC><-ParamD, +ParamD><?ParamE><!ParamF>
 * ```
 * we can call:
 * ```js
 * call($, 'item', 'param_a', ['param_b', 'param_c'], ['', 'param_d'], {param_e}, {param_f: !param_f})
 * ```
 * @param $           the grammar symbols object
 * @param family_name the name of the production without parameters
 * @param args        argument names or objects of inherited argument values from the containing production
 * @returns           a property name of the `$` object
 */
function call<RuleName extends string>($: GrammarSymbols<RuleName>, family_name: string, ...args: readonly (string | readonly string[] | Readonly<Record<string, boolean>>)[]): Rule {
	if (args.some((arg) => Array.isArray(arg))) {
		const [index, opts] = args.entries().find(([_, arg]) => Array.isArray(arg)) as [number, readonly string[]];
		return choice(...opts.map((opt) => call<RuleName>(
			$,
			family_name,
			...args.slice(0, index),
			opt,
			...args.slice(index + 1),
		)));
	}
	return $[familyName(family_name, args.flatMap((arg) => ((typeof arg === 'string')
		? arg.length ? [arg] : []
		: Object.entries(arg)
			.filter(([_,    is_true]) => is_true)
			.map   (([name, _])       => name)
	)))];
}



/* # LEXER HELPERS */
const WORD_BASIC   = /[A-Za-z][A-Za-z0-9_]*|_[A-Za-z0-9_]+/;
const WORD_UNICODE = /'[^']*'/;

const DIGIT_SEQ_BIN            = /[0-1]+/;
const DIGIT_SEQ_BIN__SEPARATOR = /([0-1]_?)*[0-1]/;
const DIGIT_SEQ_QUA            = /[0-3]+/;
const DIGIT_SEQ_QUA__SEPARATOR = /([0-3]_?)*[0-3]/;
const DIGIT_SEQ_SEX            = /[0-5]+/;
const DIGIT_SEQ_SEX__SEPARATOR = /([0-5]_?)*[0-5]/;
const DIGIT_SEQ_OCT            = /[0-7]+/;
const DIGIT_SEQ_OCT__SEPARATOR = /([0-7]_?)*[0-7]/;
const DIGIT_SEQ_DEC            = /[0-9]+/;
const DIGIT_SEQ_DEC__SEPARATOR = /([0-9]_?)*[0-9]/;
const DIGIT_SEQ_HEX            = /[0-9a-f]+/;
const DIGIT_SEQ_HEX__SEPARATOR = /([0-9a-f]_?)*[0-9a-f]/;
const DIGIT_SEQ_NIF            = /[0-9a-z]+/;
const DIGIT_SEQ_NIF__SEPARATOR = /([0-9a-z]_?)*[0-9a-z]/;

const INTEGER_DIGITS_RADIX = choice(
	seq('\\b',           DIGIT_SEQ_BIN),
	seq('\\q',           DIGIT_SEQ_QUA),
	seq('\\s',           DIGIT_SEQ_SEX),
	seq('\\o',           DIGIT_SEQ_OCT),
	seq(optional('\\d'), DIGIT_SEQ_DEC),
	seq('\\x',           DIGIT_SEQ_HEX),
	seq('\\z',           DIGIT_SEQ_NIF),
);
const INTEGER_DIGITS_RADIX__SEPARATOR = choice(
	seq('\\b',           DIGIT_SEQ_BIN__SEPARATOR),
	seq('\\q',           DIGIT_SEQ_QUA__SEPARATOR),
	seq('\\s',           DIGIT_SEQ_SEX__SEPARATOR),
	seq('\\o',           DIGIT_SEQ_OCT__SEPARATOR),
	seq(optional('\\d'), DIGIT_SEQ_DEC__SEPARATOR),
	seq('\\x',           DIGIT_SEQ_HEX__SEPARATOR),
	seq('\\z',           DIGIT_SEQ_NIF__SEPARATOR),
);

const SIGNED_DIGIT_SEQ_DEC            = seq(/[+-]?/, DIGIT_SEQ_DEC);
const SIGNED_DIGIT_SEQ_DEC__SEPARATOR = seq(/[+-]?/, DIGIT_SEQ_DEC__SEPARATOR);

const EXPONENT_PART            = seq('e', SIGNED_DIGIT_SEQ_DEC);
const EXPONENT_PART__SEPARATOR = seq('e', SIGNED_DIGIT_SEQ_DEC__SEPARATOR);

const ESCAPER            = '\\';
const DELIM_STRING       = '"';
const DELIM_TEMPLATE     = '"""';
const DELIM_INTERP_START = '{{';
const DELIM_INTERP_END   = '}}';
const COMMENTER_LINE     = '%';

/* eslint-disable @stylistic/function-call-argument-newline */
const STRING_ESCAPE = choice(
	DELIM_STRING,
	ESCAPER,
	's', 't', 'n', 'r',
	seq('u{', optional(DIGIT_SEQ_HEX), '}'),
	'\n',
	/[^"\\stnru\n]/,
);
const STRING_ESCAPE__COMMENT = choice(
	DELIM_STRING,
	ESCAPER,
	COMMENTER_LINE,
	's', 't', 'n', 'r',
	seq('u{', optional(DIGIT_SEQ_HEX), '}'),
	'\n',
	/[^"\\%stnru\n]/,
);
const STRING_ESCAPE__SEPARATOR = choice(
	DELIM_STRING,
	ESCAPER,
	's', 't', 'n', 'r',
	seq('u{', optional(DIGIT_SEQ_HEX__SEPARATOR), '}'),
	'\n',
	/[^"\\stnru\n]/,
);
const STRING_ESCAPE__COMMENT_SEPARATOR = choice(
	DELIM_STRING,
	ESCAPER,
	COMMENTER_LINE,
	's', 't', 'n', 'r',
	seq('u{', optional(DIGIT_SEQ_HEX__SEPARATOR), '}'),
	'\n',
	/[^"\\%stnru\n]/,
);
/* eslint-enable @stylistic/function-call-argument-newline */

const STRING_CHAR = choice(
	/[^"\\]/,
	seq(ESCAPER, STRING_ESCAPE),
	/\\u[^"{]/,
);
const STRING_CHAR__COMMENT = choice(
	/[^"\\%]/,
	seq(ESCAPER, STRING_ESCAPE__COMMENT),
	/\\u[^"{]/,
	/%([^"%\n][^"\n]*)?\n/,
	/%%(%?[^"%])*%%/,
);
const STRING_CHAR__SEPARATOR = choice(
	/[^"\\]/,
	seq(ESCAPER, STRING_ESCAPE__SEPARATOR),
	/\\u[^"{]/,
);
const STRING_CHAR__COMMENT__SEPARATOR = choice(
	/[^"\\%]/,
	seq(ESCAPER, STRING_ESCAPE__COMMENT_SEPARATOR),
	/\\u[^"{]/,
	/%([^"%\n][^"\n]*)?\n/,
	/%%(%?[^"%])*%%/,
);

const STRING_CHARS                     = repeat1(STRING_CHAR);
const STRING_CHARS__COMMENT            = repeat1(STRING_CHAR__COMMENT);
const STRING_CHARS__SEPARATOR          = repeat1(STRING_CHAR__SEPARATOR);
const STRING_CHARS__COMMENT__SEPARATOR = repeat1(STRING_CHAR__COMMENT__SEPARATOR);

const STRING_UNFINISHED          = '\\u';
const STRING_UNFINISHED__COMMENT = choice(
	'\\u',
	/%([^"%\n][^"\n]*)?/,
	/%%(%?[^"%])*/,
);

const TEMPLATE_CHARS_NO_END = choice(
	/[^"{]/,
	/("\{|""\{)*("|"")[^"{]/,
	/("\{|""\{)+[^"{]/,
	/(\{"|\{"")*\{[^"{]/,
	/(\{"|\{"")+[^"{]/,
);
const TEMPLATE_CHARS_END_DELIM = seq(repeat(TEMPLATE_CHARS_NO_END), choice(
	/[^"{]/,
	/("\{|""\{)*("|"")[^"{]/,
	/("\{|""\{)+[^"{]?/,
	/(\{"|\{"")*\{[^"{]?/,
	/(\{"|\{"")+[^"{]/,
));
const TEMPLATE_CHARS_END_INTERP = seq(repeat(TEMPLATE_CHARS_NO_END), choice(
	/[^"{]/,
	/("\{|""\{)*("|"")[^"{]?/,
	/("\{|""\{)+[^"{]/,
	/(\{"|\{"")*\{[^"{]/,
	/(\{"|\{"")+[^"{]?/,
));



/* # PARSER HELPERS */
const OPT_COM = optional(',');

/**
 * Reference a rule based on a condition.
 *
 * If needing an alternative, use a simple ternary operator:
 * ```
 * condition ? consequent : alternative
 * ```
 * Otherwise, spread it into a rule:
 * @example
 * {
 * 	...parameterize('entry_type__optional', ({named}) => $ => seq(...iff(named, $.word), '?:', $._type), 'named'),
 * }
 * @param condition   the condition to test
 * @param consequent  if condition is true, this will be produced
 * @returns           if `condition`, then `[consequent]`; else `[]`
 */
function iff(condition: boolean, consequent: RuleOrLiteral): [RuleOrLiteral] | [] {
	return condition ? [consequent] : [];
}
function repCom1(production: RuleOrLiteral): SeqRule {
	return seq(repeat(seq(production, ',')), production);
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function repCom(production: RuleOrLiteral): ChoiceRule {
	return optional(repCom1(production));
}
function uSeq(left: RuleOrLiteral, right: RuleOrLiteral): ChoiceRule {
	return choice(
		seq(left, right),
		seq(right, left),
	);
}



/* eslint-disable @stylistic/arrow-parens */
module.exports = grammar({
	name: 'counterpoint',

	rules: {
		source_file: $ => optional($.block),



		/* # LEXICON */
		identifier: _$ => token(choice(
			WORD_BASIC,
			WORD_UNICODE,
		)),

		...parameterize('integer', ({radix, separator}) => (
			_$ => token(seq(/[+-]?/, ((!radix)
				? (!separator) ? DIGIT_SEQ_DEC        : DIGIT_SEQ_DEC__SEPARATOR
				: (!separator) ? INTEGER_DIGITS_RADIX : INTEGER_DIGITS_RADIX__SEPARATOR
			)))
		), 'radix', 'separator'),

		...parameterize('float', ({separator}) => (
			_$ => token(seq(
				(!separator) ? SIGNED_DIGIT_SEQ_DEC : SIGNED_DIGIT_SEQ_DEC__SEPARATOR,
				'.',
				         (!separator) ? DIGIT_SEQ_DEC : DIGIT_SEQ_DEC__SEPARATOR, // eslint-disable-line @stylistic/indent
				optional((!separator) ? EXPONENT_PART : EXPONENT_PART__SEPARATOR),
			))
		), 'separator'),

		...parameterize('string', ({comment, separator}) => (
			_$ => token(seq(
				DELIM_STRING,
				optional(((!comment)
					? (!separator) ? STRING_CHARS          : STRING_CHARS__SEPARATOR
					: (!separator) ? STRING_CHARS__COMMENT : STRING_CHARS__COMMENT__SEPARATOR
				)),
				optional((!comment) ? STRING_UNFINISHED : STRING_UNFINISHED__COMMENT),
				DELIM_STRING,
			))
		), 'comment', 'separator'),

		template_full:   _$ => token(seq(DELIM_TEMPLATE,   optional(TEMPLATE_CHARS_END_DELIM),  DELIM_TEMPLATE)),
		template_head:   _$ => token(seq(DELIM_TEMPLATE,   optional(TEMPLATE_CHARS_END_INTERP), DELIM_INTERP_START)),
		template_middle: _$ => token(seq(DELIM_INTERP_END, optional(TEMPLATE_CHARS_END_INTERP), DELIM_INTERP_START)),
		template_tail:   _$ => token(seq(DELIM_INTERP_END, optional(TEMPLATE_CHARS_END_DELIM),  DELIM_TEMPLATE)),



		/* # SYNTAX */
		keyword_type: _$ => choice(
			'nothing',
			'bool',
			'sym',
			'int',
			'float',
			'str',
			'anything',
		),
		keyword_value: _$ => choice(
			'null',
			'false',
			'true',
		),

		word: $ => choice(
			// operator
			'mut',
			'as',
			'is',
			'isnt',
			'if',
			'then',
			'else',
			// storage
			'type',
			'let',
			'claim',
			'set',
			'_',
			'void',
			// modifier
			'nominal',
			'var',
			// control
			'unless',
			'while',
			'until',
			'for',
			'of',
			'do',
			'break',
			'continue',
			$.identifier,
			$.keyword_type,
			$.keyword_value,
		),

		primitive_literal: $ => choice(
			call($, 'integer', ['', 'radix'], ['', 'separator']),
			call($, 'float', ['', 'separator']),
			call($, 'string', ['', 'comment'], ['', 'separator']),
			$.keyword_value,
			seq('@', $.word),
		),


		/* ## Types */
		...parameterize('entry_type', ({named, optional}) => (
			$ => seq(...iff(named, seq($.word, ...iff(!optional, ':'))), ...iff(optional, '?:'), $._type)
		), 'named', 'optional'),

		_items_type: $ => {
			const LIST_ENT_OPT: SeqRule = repCom1(call($, 'entry_type', 'optional'));
			return choice(
				seq(                                                                 OPT_COM,              LIST_ENT_OPT,   OPT_COM),
				seq(         $.entry_type,                                           ',',     optional(seq(LIST_ENT_OPT,   OPT_COM))),
				seq(optional($.entry_type), ',', repCom1($.entry_type), optional(seq(',',                  LIST_ENT_OPT)), OPT_COM),
			);
		},

		_properties_type: $ => seq(OPT_COM, repCom1(call($, 'entry_type', 'named', ['', 'optional'])), OPT_COM),

		type_grouped:        $ => seq('(', $._type,                            ')'),
		type_tuple_literal:  $ => seq('(', optional($._items_type),            ')'),
		type_record_literal: $ => seq('(', $._properties_type,                 ')'),
		type_list_literal:   $ => seq('[', $._type,                            ']'),
		type_dict_literal:   $ => seq('[', ':', $._type,                       ']'),
		type_set_literal:    $ => seq('{', $._type,                            '}'),
		type_map_literal:    $ => seq('{', $._type, '->', $._type,             '}'),
		generic_arguments:   $ => seq('<', OPT_COM, repCom1($._type), OPT_COM, '>'),

		_type_unit: $ => choice(
			$.identifier,
			$.keyword_type,
			$.primitive_literal,
			$.type_grouped,
			$.type_tuple_literal,
			$.type_record_literal,
			$.type_list_literal,
			$.type_dict_literal,
			$.type_set_literal,
			$.type_map_literal,
		),

		property_accessor_type: $ => choice($.integer, $.word),

		_type_compound: $ => choice(
			$._type_unit,
			alias($.type_compound_dfn, $.type_compound),
		),
		type_compound_dfn: $ => seq($._type_compound, choice(
			seq(choice('.', '?.'), $.property_accessor_type),
			seq('.',               $.generic_arguments),
		)),

		_type_unary_symbol: $ => choice(
			$._type_compound,
			alias($.type_unary_symbol_dfn, $.type_unary_symbol),
		),
		type_unary_symbol_dfn: $ => seq($._type_unary_symbol, choice('?', '!')),

		_type_unary_keyword: $ => choice(
			$._type_unary_symbol,
			alias($.type_unary_keyword_dfn, $.type_unary_keyword),
		),
		type_unary_keyword_dfn: $ => seq('mut', $._type_unary_keyword),

		_type_intersection: $ => choice($._type_unary_keyword, alias($.type_intersection_dfn, $.type_intersection)),
		_type_union:        $ => choice($._type_intersection,  alias($.type_union_dfn,        $.type_union)),

		type_intersection_dfn: $ => seq($._type_intersection, '&', $._type_unary_keyword),
		type_union_dfn:        $ => seq($._type_union,        '|', $._type_intersection),

		/* eslint-disable @stylistic/function-paren-newline */
		_type: $ => choice(
			$._type_union,
		),
		/* eslint-enable @stylistic/function-paren-newline */


		/* ## Expressions */
		...parameterize('string_template', ({break: brk}) => $ => choice(
			$.template_full,
			seq($.template_head, optional(call($, '_expression', 'block', {break: brk})), repeat(seq($.template_middle, optional(call($, '_expression', 'block', {break: brk})))), $.template_tail),
		), 'break'),

		...parameterize('_items', ({break: brk}) => $ => choice(
			seq(         call($, '_expression', 'block', {break: brk}),  ','),
			seq(optional(call($, '_expression', 'block', {break: brk})), ',', repCom1(call($, '_expression', 'block', {break: brk})), OPT_COM),
		), 'break'),

		...parameterize('property', ({break: brk}) => $ => seq($.word,                                        '=',  call($, '_expression', 'block', {break: brk})), 'break'),
		...parameterize('case',     ({break: brk}) => $ => seq(call($, '_expression', 'block', {break: brk}), '->', call($, '_expression', 'block', {break: brk})), 'break'),

		...parameterize('expression_grouped', ({break: brk}) => $ => seq('(',                               call($, '_expression', 'block', {break: brk}),             ')'), 'break'),
		...parameterize('tuple_literal',      ({break: brk}) => $ => seq('(', optional(                     call($, '_items',   {break: brk})                       ), ')'), 'break'),
		...parameterize('record_literal',     ({break: brk}) => $ => seq('(',              OPT_COM, repCom1(call($, 'property', {break: brk})),             OPT_COM,   ')'), 'break'),
		...parameterize('list_literal',       ({break: brk}) => $ => seq('[', optional(seq(OPT_COM, repCom1(call($, '_expression', 'block', {break: brk})), OPT_COM)), ']'), 'break'),
		...parameterize('dict_literal',       ({break: brk}) => $ => seq('[',              OPT_COM, repCom1(call($, 'property', {break: brk})),             OPT_COM,   ']'), 'break'),
		...parameterize('set_literal',        ({break: brk}) => $ => seq('{', optional(seq(OPT_COM, repCom1(call($, '_expression', 'block', {break: brk})), OPT_COM)), '}'), 'break'),
		...parameterize('map_literal',        ({break: brk}) => $ => seq('{',              OPT_COM, repCom1(call($, 'case',     {break: brk})),             OPT_COM,   '}'), 'break'),
		...parameterize('function_arguments', ({break: brk}) => $ => seq('(', optional(seq(OPT_COM, repCom1(call($, '_expression', 'block', {break: brk})), OPT_COM)), ')'), 'break'),

		...parameterize('_expression_unit', ({block, break: brk}) => $ => choice(
			$.identifier,
			$.primitive_literal,
			call($, 'string_template',    {break: brk}),
			call($, 'expression_grouped', {break: brk}),
			call($, 'tuple_literal',      {break: brk}),
			call($, 'record_literal',     {break: brk}),
			call($, 'list_literal',       {break: brk}),
			call($, 'dict_literal',       {break: brk}),
			call($, 'set_literal',        {break: brk}),
			call($, 'map_literal',        {break: brk}),
			...iff(block, alias(call($, 'block', {break: brk}), $.expression_block)),
		), 'block', 'break'),

		...parameterize('property_accessor', ({break: brk}) => $ => choice($.integer, $.word, seq('[', call($, '_expression', 'block', {break: brk}), ']')), 'break'),

		...parameterize('_expression_compound', ({block, break: brk}) => $ => choice(
			call($, '_expression_unit', {block}, {break: brk}),
			alias(call($, 'expression_compound_dfn', {block}, {break: brk}), $.expression_compound),
		), 'block', 'break'),
		...parameterize('expression_compound_dfn', ({block, break: brk}) => $ => seq(call($, '_expression_compound', {block}, {break: brk}), choice(
			seq(choice('.', '?.', '!.'), call($, 'property_accessor', {break: brk})),
			seq('.',                     optional($.generic_arguments), call($, 'function_arguments', {break: brk})),
		)), 'block', 'break'),

		...parameterize('assignee', ({break: brk}) => $ => choice(
			$.identifier,
			seq(call($, '_expression_compound', 'block', {break: brk}), '.', call($, 'property_accessor', {break: brk})),
		), 'break'),

		...parameterize('_expression_unary_symbol',  ({block, break: brk}) => $ => choice(call($, '_expression_compound',     {block}, {break: brk}), alias(call($, 'expression_unary_symbol_dfn',  {block}, {break: brk}), $.expression_unary_symbol)),  'block', 'break'),
		...parameterize('_expression_unary_keyword', ({block, break: brk}) => $ => choice(call($, '_expression_unary_symbol', {block}, {break: brk}), alias(call($, 'expression_unary_keyword_dfn', {block}, {break: brk}), $.expression_unary_keyword)), 'block', 'break'),

		...parameterize('expression_unary_symbol_dfn',  ({block, break: brk}) => $ => seq(choice('!', '?', '+', '-'), call($, '_expression_unary_symbol',  {block}, {break: brk})), 'block', 'break'),
		...parameterize('expression_unary_keyword_dfn', ({block, break: brk}) => $ => seq(choice('int', 'float'),     call($, '_expression_unary_keyword', {block}, {break: brk})), 'block', 'break'),

		...parameterize('_expression_cast',           ({block, break: brk}) => $ => choice(call($, '_expression_unary_keyword',  {block}, {break: brk}), alias(call($, 'expression_cast_dfn',           {block}, {break: brk}), $.expression_cast)),           'block', 'break'),
		...parameterize('_expression_exponential',    ({block, break: brk}) => $ => choice(call($, '_expression_cast',           {block}, {break: brk}), alias(call($, 'expression_exponential_dfn',    {block}, {break: brk}), $.expression_exponential)),    'block', 'break'),
		...parameterize('_expression_multiplicative', ({block, break: brk}) => $ => choice(call($, '_expression_exponential',    {block}, {break: brk}), alias(call($, 'expression_multiplicative_dfn', {block}, {break: brk}), $.expression_multiplicative)), 'block', 'break'),
		...parameterize('_expression_additive',       ({block, break: brk}) => $ => choice(call($, '_expression_multiplicative', {block}, {break: brk}), alias(call($, 'expression_additive_dfn',       {block}, {break: brk}), $.expression_additive)),       'block', 'break'),
		...parameterize('_expression_comparative',    ({block, break: brk}) => $ => choice(call($, '_expression_additive',       {block}, {break: brk}), alias(call($, 'expression_comparative_dfn',    {block}, {break: brk}), $.expression_comparative)),    'block', 'break'),
		...parameterize('_expression_equality',       ({block, break: brk}) => $ => choice(call($, '_expression_comparative',    {block}, {break: brk}), alias(call($, 'expression_equality_dfn',       {block}, {break: brk}), $.expression_equality)),       'block', 'break'),
		...parameterize('_expression_conjunctive',    ({block, break: brk}) => $ => choice(call($, '_expression_equality',       {block}, {break: brk}), alias(call($, 'expression_conjunctive_dfn',    {block}, {break: brk}), $.expression_conjunctive)),    'block', 'break'),
		...parameterize('_expression_disjunctive',    ({block, break: brk}) => $ => choice(call($, '_expression_conjunctive',    {block}, {break: brk}), alias(call($, 'expression_disjunctive_dfn',    {block}, {break: brk}), $.expression_disjunctive)),    'block', 'break'),

		...parameterize('expression_cast_dfn',           ({block, break: brk}) => $ => choice(seq(call($, '_expression_cast',           {block}, {break: brk}), choice('as', 'as?', 'as!'),                             call($, '_expression_unary_symbol',   {block}, {break: brk})), seq(call($, '_expression_cast', {block}, {break: brk}), 'as', '<', $._type, '>')), 'block', 'break'),
		...parameterize('expression_exponential_dfn',    ({block, break: brk}) => $ =>        seq(call($, '_expression_cast',           {block}, {break: brk}), '^',                                                    call($, '_expression_exponential',    {block}, {break: brk})), 'block', 'break'),
		...parameterize('expression_multiplicative_dfn', ({block, break: brk}) => $ =>        seq(call($, '_expression_multiplicative', {block}, {break: brk}), choice('*', '/'),                                       call($, '_expression_exponential',    {block}, {break: brk})), 'block', 'break'),
		...parameterize('expression_additive_dfn',       ({block, break: brk}) => $ =>        seq(call($, '_expression_additive',       {block}, {break: brk}), choice('+', '-'),                                       call($, '_expression_multiplicative', {block}, {break: brk})), 'block', 'break'),
		...parameterize('expression_comparative_dfn',    ({block, break: brk}) => $ =>        seq(call($, '_expression_comparative',    {block}, {break: brk}), choice('<', '>', '<=', '>=', '!<', '!>', 'is', 'isnt'), call($, '_expression_additive',       {block}, {break: brk})), 'block', 'break'),
		...parameterize('expression_equality_dfn',       ({block, break: brk}) => $ =>        seq(call($, '_expression_equality',       {block}, {break: brk}), choice('===', '!==', '==', '!='),                       call($, '_expression_comparative',    {block}, {break: brk})), 'block', 'break'),
		...parameterize('expression_conjunctive_dfn',    ({block, break: brk}) => $ =>        seq(call($, '_expression_conjunctive',    {block}, {break: brk}), choice('&&', '!&'),                                     call($, '_expression_equality',       {block}, {break: brk})), 'block', 'break'),
		...parameterize('expression_disjunctive_dfn',    ({block, break: brk}) => $ =>        seq(call($, '_expression_disjunctive',    {block}, {break: brk}), choice('||', '!|'),                                     call($, '_expression_conjunctive',    {block}, {break: brk})), 'block', 'break'),

		...parameterize('expression_conditional', ({break: brk}) => $ => seq('if', call($, '_expression', 'block', {break: brk}), 'then', call($, '_expression', {break: brk}), 'else', call($, '_expression', {break: brk})), 'break'),

		...parameterize('_expression', ({block, break: brk}) => $ => choice(
			call($, '_expression_disjunctive', {block}, {break: brk}),
			call($, 'expression_conditional', {break: brk}),
		), 'block', 'break'),


		/* ## Statements */
		...parameterize('statement_expression', ({break: brk}) => $ => seq(optional(call($, '_expression', 'block', {break: brk})), ';'), 'break'),

		...parameterize('statement_conditional', ({unless, break: brk}) => $ => seq(
			!unless ? 'if' : 'unless',
			call($, '_expression', 'block', {break: brk}),
			'then',
			call($, 'block', {break: brk}),
			!unless
				? choice(
					seq(optional(seq('else', call($, 'block', {break: brk}))), ';'),
					seq('else', call($, 'statement_conditional', {unless}, {break: brk})),
				)
				: ';',
		), 'unless', 'break'),

		statement_loop: $ => seq(uSeq(seq(choice('while', 'until'), call($, '_expression', 'block')), seq('do', call($, 'block', 'break'))), ';'),

		statement_iteration: $ => seq('for', choice('_', $.identifier), ':', $._type, 'of', call($, '_expression', 'block'), 'do', call($, 'block', 'break'), ';'),

		statement_break: $ => seq(choice('break', 'continue'), optional($.integer), ';'),

		...parameterize('_statement', ({break: brk}) => $ => choice(
			call($, 'statement_expression', {break: brk}),
			call($, 'statement_conditional', ['', 'unless'], {break: brk}),
			$.statement_loop,
			$.statement_iteration,
			...iff(brk, $.statement_break),
			call($, '_declaration', {break: brk}),
		), 'break'),

		...parameterize('block', ({break: brk}) => $ => seq('{', repeat1(call($, '_statement', {break: brk})), '}'), 'break'),

		declaration_type: $ => seq('type', choice('_', $.identifier), '=', $._type, ';'),

		...parameterize('declaration_variable', ({break: brk}) => $ => choice(
			seq('let', optional('var'), choice('_', $.identifier), ':',  $._type, '=', call($, '_expression', 'block', {break: brk}), ';'),
			seq('let',          'var',  choice('_', $.identifier), '?:', $._type,                                                     ';'),
		), 'break'),

		...parameterize('declaration_claim',        ({break: brk}) => $ => seq('claim', call($, 'assignee', {break: brk}), ':', $._type,                                       ';'), 'break'),
		...parameterize('declaration_reassignment', ({break: brk}) => $ => seq('set',   call($, 'assignee', {break: brk}), '=', call($, '_expression', 'block', {break: brk}), ';'), 'break'),

		...parameterize('_declaration', ({break: brk}) => $ => choice(
			$.declaration_type,
			call($, 'declaration_variable',     {break: brk}),
			call($, 'declaration_claim',        {break: brk}),
			call($, 'declaration_reassignment', {break: brk}),
		), 'break'),
	},

	extras: _$ => [
		/(\u0020|\t|\n)+/, // whitespace
		token(choice(
			/%([^%\n][^\n]*)?\n/, // line comment
			/%%(%?[^%])*%%/,      // multiline comment
		)),
	],

	/**
	 * Uses the GLR algorithm to resolve *intended conflicts* in the grammar.
	 * @see https://tree-sitter.github.io/tree-sitter/creating-parsers/2-the-grammar-dsl.html
	 */
	conflicts: _$ => [
		// example:
		// familyNameAll('integer', ['radix', 'separator']).map((rulename) => _$[rulename]),
	],

	/**
	 * Tries to match `$.identifier` first before matching any keyword literals in the grammar.
	 * @see https://tree-sitter.github.io/tree-sitter/creating-parsers/3-writing-the-grammar.html#keyword-extraction
	 */
	word: $ => $.identifier,

	supertypes: $ => [
		$._type_unit,
		$._type,
		...familyNameAll('_expression_unit', ['block']).map((rulename) => $[rulename]),
		...familyNameAll('_expression',      ['block']).map((rulename) => $[rulename]),
		...familyNameAll('_statement',       ['break']).map((rulename) => $[rulename]),
		...familyNameAll('_declaration',     ['break']).map((rulename) => $[rulename]),
	],

	reserved: {
		global: _$ => [
			// operator
			'mut',
			'as',
			'is',
			'isnt',
			'if',
			'then',
			'else',
			// storage
			'type',
			'let',
			'claim',
			'set',
			'_',
			'void',
			// modifier
			'nominal',
			'var',
			// control
			'unless',
			'while',
			'until',
			'for',
			'of',
			'do',
			'break',
			'continue',
			// type keyword
			'nothing',
			'bool',
			'sym',
			'int',
			'float',
			'str',
			'anything',
			// value keyword
			'null',
			'false',
			'true',
		],
	},
});
/* eslint-enable @stylistic/arrow-parens */
