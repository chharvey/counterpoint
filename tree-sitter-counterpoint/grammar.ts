// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../node_modules/tree-sitter-cli/dsl.d.ts"/>



function argsArr(nth: number, params: readonly string[]): readonly string[] {
	// e.g. `['await', 'static', 'instance', 'method']`
	return [...nth.toString(2).padStart(params.length, '0')] // e.g. (if `nth` is 5 out of 15) `[0, 1, 0, 1]`
		.map<[string, boolean]>((bit, i) => [params[i], !!+bit]) // `[['await', false],  ['static', true],  ['instance', false],  ['method', true]]`
		.filter(([_param, to_include]) => !!to_include)          // `[['static', true],  ['method', true]]`
		.map(([param, _to_include]) => param);                   // `['static', 'method']`
}
function familyName<RuleName extends string>(family_name: string, ...suffices: readonly string[]): RuleName {
	return family_name.concat((suffices.length) ? `__${ suffices.join('__') }` : '') as RuleName;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function familyNameAll<RuleName extends string>(family_name: string, params: readonly string[]): RuleName[] {
	return [...new Array<undefined>(2 ** params.length)].map((_, nth) => familyName(family_name, ...argsArr(nth, params)));
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
 * 		$[call('item_b', 'param_a')],
 * 		$[call('item_c', 'param_a')],                       // ignore false arguments
 * 		$[call('item_d', {param_c}, 'param_a', 'param_b')], // `param_c` is inherited
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
			familyName(family_name, ...args_arr),
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
 * Item<+ParamA><+ParamB><-ParamC><?ParamD>
 * ```
 * we can call:
 * ```js
 * $[call('item', 'param_a', 'param_b', {param_d})]
 * ```
 * @param family_name the name of the production without parameters
 * @param args        argument names or objects of inherited argument values from the containing production
 * @returns           a property name of the `$` object
 */
function call<RuleName extends string>(family_name: string, ...args: readonly (string | Readonly<Record<string, boolean>>)[]): RuleName {
	return familyName(family_name, ...args.flatMap((arg) => ((typeof arg === 'string')
		? [arg]
		: Object.entries(arg)
			.filter(([_,    is_true]) => is_true)
			.map   (([name, _])       => name)
	)));
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
 * @param condition   the condition to test
 * @param consequent  if condition is true, this will be produced
 * @returns           either `consequent` or `blank()` based on `condition`
 */
function iff(condition: boolean, consequent: RuleOrLiteral): RuleOrLiteral {
	return condition ? consequent : blank();
}
/**
 * Like {@link iff}, but meant for spreading, like in a choice list.
 * @param condition   the condition to test
 * @param consequent  if condition is true, this will be produced
 * @returns           either `[consequent]` or `[]` based on `condition`
 */
function iffSpread(condition: boolean, consequent: RuleOrLiteral): RuleOrLiteral[] {
	return condition ? [consequent] : [];
}
function repCom1(production: RuleOrLiteral): SeqRule {
	return seq(repeat(seq(production, ',')), production);
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function repCom(production: RuleOrLiteral): ChoiceRule {
	return optional(repCom1(production));
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
			$.identifier,
			$.keyword_type,
			$.keyword_value,
		),

		primitive_literal: $ => choice(
			$.integer,
			$.integer__radix,
			$.integer__separator,
			$.integer__radix__separator,
			$.float,
			$.float__separator,
			$.string,
			$.string__comment,
			$.string__separator,
			$.string__comment__separator,
			$.keyword_value,
			seq('@', $.word),
		),


		/* ## Types */
		...parameterize('entry_type', ({named, optional}) => (
			$ => seq(iff(named, seq($.word, iff(!optional, ':'))), iff(optional, '?:'), $._type)
		), 'named', 'optional'),

		_items_type: $ => {
			const LIST_ENT_OPT: SeqRule = repCom1($[call('entry_type', 'optional')]);
			return choice(
				seq(                                                                 OPT_COM,              LIST_ENT_OPT,   OPT_COM),
				seq(         $.entry_type,                                           ',',     optional(seq(LIST_ENT_OPT,   OPT_COM))),
				seq(optional($.entry_type), ',', repCom1($.entry_type), optional(seq(',',                  LIST_ENT_OPT)), OPT_COM),
			);
		},

		_properties_type: $ => seq(OPT_COM, repCom1(choice($[call('entry_type', 'named')], $[call('entry_type', 'named', 'optional')])), OPT_COM),

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

		property_access_type: $ => seq(choice('.', '?.'), choice($.integer, $.word)),
		generic_call:         $ => seq('.',               $.generic_arguments),

		_type_compound: $ => choice(
			$._type_unit,
			alias($.type_compound_dfn, $.type_compound),
		),
		type_compound_dfn: $ => seq($._type_compound, choice($.property_access_type, $.generic_call)),

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
		string_template: $ => choice(
			$.template_full,
			seq($.template_head, optional($._expression__block), repeat(seq($.template_middle, optional($._expression__block))), $.template_tail),
		),

		_items: $ => choice(
			seq(         $._expression__block,  ','),
			seq(optional($._expression__block), ',', repCom1($._expression__block), OPT_COM),
		),

		property: $ => seq($.word,               '=',  $._expression__block),
		case:     $ => seq($._expression__block, '->', $._expression__block),

		expression_grouped: $ => seq('(',                       $._expression__block,                     ')'),
		tuple_literal:      $ => seq('(', optional(             $._items                               ), ')'),
		record_literal:     $ => seq('(',              OPT_COM, repCom1($.property),           OPT_COM,   ')'),
		list_literal:       $ => seq('[', optional(seq(OPT_COM, repCom1($._expression__block), OPT_COM)), ']'),
		dict_literal:       $ => seq('[',              OPT_COM, repCom1($.property),           OPT_COM,   ']'),
		set_literal:        $ => seq('{', optional(seq(OPT_COM, repCom1($._expression__block), OPT_COM)), '}'),
		map_literal:        $ => seq('{',              OPT_COM, repCom1($.case),               OPT_COM,   '}'),
		function_arguments: $ => seq('(', optional(seq(OPT_COM, repCom1($._expression__block), OPT_COM)), ')'),

		...parameterize('_expression_unit', ({block}) => $ => choice(
			$.identifier,
			$.primitive_literal,
			$.string_template,
			$.expression_grouped,
			$.tuple_literal,
			$.record_literal,
			$.list_literal,
			$.dict_literal,
			$.set_literal,
			$.map_literal,
			...iffSpread(block, alias($.block, $.expression_block)),
		), 'block'),

		property_access: $ => seq(choice('.', '?.', '!.'), choice($.integer, $.word, seq('[', $._expression__block, ']'))),
		property_assign: $ => seq('.',                     choice($.integer, $.word, seq('[', $._expression__block, ']'))),
		function_call:   $ => seq('.',                     optional($.generic_arguments), $.function_arguments),

		...parameterize('_expression_compound', ({block}) => $ => choice(
			$[call('_expression_unit', {block})],
			alias($[call('expression_compound_dfn', {block})], $.expression_compound),
		), 'block'),
		...parameterize('expression_compound_dfn', ({block}) => $ => seq($[call('_expression_compound', {block})], choice($.property_access, $.function_call)), 'block'),

		assignee: $ => choice(
			$.identifier,
			seq($._expression_compound__block, $.property_assign),
		),

		...parameterize('_expression_unary_symbol',  ({block}) => $ => choice($[call('_expression_compound',     {block})], alias($[call('expression_unary_symbol_dfn',  {block})], $.expression_unary_symbol)),  'block'),
		...parameterize('_expression_unary_keyword', ({block}) => $ => choice($[call('_expression_unary_symbol', {block})], alias($[call('expression_unary_keyword_dfn', {block})], $.expression_unary_keyword)), 'block'),

		...parameterize('expression_unary_symbol_dfn',  ({block}) => $ => seq(choice('!', '?', '+', '-'), $[call('_expression_unary_symbol',  {block})]), 'block'),
		...parameterize('expression_unary_keyword_dfn', ({block}) => $ => seq(choice('int', 'float'),     $[call('_expression_unary_keyword', {block})]), 'block'),

		...parameterize('_expression_cast',           ({block}) => $ => choice($[call('_expression_unary_keyword',  {block})], alias($[call('expression_cast_dfn',           {block})], $.expression_cast)),           'block'),
		...parameterize('_expression_exponential',    ({block}) => $ => choice($[call('_expression_cast',           {block})], alias($[call('expression_exponential_dfn',    {block})], $.expression_exponential)),    'block'),
		...parameterize('_expression_multiplicative', ({block}) => $ => choice($[call('_expression_exponential',    {block})], alias($[call('expression_multiplicative_dfn', {block})], $.expression_multiplicative)), 'block'),
		...parameterize('_expression_additive',       ({block}) => $ => choice($[call('_expression_multiplicative', {block})], alias($[call('expression_additive_dfn',       {block})], $.expression_additive)),       'block'),
		...parameterize('_expression_comparative',    ({block}) => $ => choice($[call('_expression_additive',       {block})], alias($[call('expression_comparative_dfn',    {block})], $.expression_comparative)),    'block'),
		...parameterize('_expression_equality',       ({block}) => $ => choice($[call('_expression_comparative',    {block})], alias($[call('expression_equality_dfn',       {block})], $.expression_equality)),       'block'),
		...parameterize('_expression_conjunctive',    ({block}) => $ => choice($[call('_expression_equality',       {block})], alias($[call('expression_conjunctive_dfn',    {block})], $.expression_conjunctive)),    'block'),
		...parameterize('_expression_disjunctive',    ({block}) => $ => choice($[call('_expression_conjunctive',    {block})], alias($[call('expression_disjunctive_dfn',    {block})], $.expression_disjunctive)),    'block'),

		...parameterize('expression_cast_dfn',           ({block}) => $ => choice(seq($[call('_expression_cast',           {block})], choice('as', 'as?', 'as!'),                             $[call('_expression_unary_symbol',   {block})]), seq($[call('_expression_cast', {block})], 'as', '<', $._type, '>')), 'block'),
		...parameterize('expression_exponential_dfn',    ({block}) => $ =>        seq($[call('_expression_cast',           {block})], '^',                                                    $[call('_expression_exponential',    {block})]), 'block'),
		...parameterize('expression_multiplicative_dfn', ({block}) => $ =>        seq($[call('_expression_multiplicative', {block})], choice('*', '/'),                                       $[call('_expression_exponential',    {block})]), 'block'),
		...parameterize('expression_additive_dfn',       ({block}) => $ =>        seq($[call('_expression_additive',       {block})], choice('+', '-'),                                       $[call('_expression_multiplicative', {block})]), 'block'),
		...parameterize('expression_comparative_dfn',    ({block}) => $ =>        seq($[call('_expression_comparative',    {block})], choice('<', '>', '<=', '>=', '!<', '!>', 'is', 'isnt'), $[call('_expression_additive',       {block})]), 'block'),
		...parameterize('expression_equality_dfn',       ({block}) => $ =>        seq($[call('_expression_equality',       {block})], choice('===', '!==', '==', '!='),                       $[call('_expression_comparative',    {block})]), 'block'),
		...parameterize('expression_conjunctive_dfn',    ({block}) => $ =>        seq($[call('_expression_conjunctive',    {block})], choice('&&', '!&'),                                     $[call('_expression_equality',       {block})]), 'block'),
		...parameterize('expression_disjunctive_dfn',    ({block}) => $ =>        seq($[call('_expression_disjunctive',    {block})], choice('||', '!|'),                                     $[call('_expression_conjunctive',    {block})]), 'block'),

		expression_conditional: $ => seq('if', $._expression__block, 'then', $._expression, 'else', $._expression),

		...parameterize('_expression', ({block}) => $ => choice(
			$[call('_expression_disjunctive', {block})],
			$.expression_conditional,
		), 'block'),


		/* ## Statements */
		statement_expression: $ => seq(optional($._expression__block), ';'),

		...parameterize('statement_conditional', ({unless}) => $ => seq(
			iff(!unless, 'if'),
			iff( unless, 'unless'),
			$._expression__block,
			'then',
			$.block,
			iff(!unless, choice(
				seq(optional(seq('else', $.block)), ';'),
				seq('else', $[call('statement_conditional', {unless})]),
			)),
			iff(unless, ';'),
		), 'unless'),

		_statement: $ => choice(
			$.statement_expression,
			choice($.statement_conditional, $.statement_conditional__unless), // TODO: write a function for representing calling `StatementConditional<∓Unless>`
			$._declaration,
		),

		block: $ => seq('{', repeat1($._statement), '}'),

		declaration_type: $ => seq('type', choice('_', $.identifier), '=', $._type, ';'),

		declaration_variable: $ => choice(
			seq('let', optional('var'), choice('_', $.identifier), ':',  $._type, '=', $._expression__block, ';'),
			seq('let',          'var',  choice('_', $.identifier), '?:', $._type,                            ';'),
		),

		declaration_claim:        $ => seq('claim', $.assignee, ':', $._type,              ';'),
		declaration_reassignment: $ => seq('set',   $.assignee, '=', $._expression__block, ';'),

		_declaration: $ => choice(
			$.declaration_type,
			$.declaration_variable,
			$.declaration_claim,
			$.declaration_reassignment,
		),
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
		$._expression_unit,
		$._expression,
		$._declaration,
		$._statement,
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
