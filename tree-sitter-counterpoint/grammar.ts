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
function familyNameAll<RuleName extends string>(family_name: string, params: readonly string[]): RuleName[] {
	return [...new Array(2 ** params.length)].map((_, nth) => familyName(family_name, ...argsArr(nth, params)));
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
	new Map<RuleName, RuleBuilder<RuleName>>([...new Array(2 ** params.length)].map((_, nth) => {
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
const WORD_BASIC   = /[A-Za-z_][A-Za-z0-9_]*/;
const WORD_UNICODE = /'[^']*'/;

const DIGIT_SEQ_BIN            = /[0-1]+/;
const DIGIT_SEQ_BIN__SEPARATOR = /([0-1]_?)*[0-1]/;
const DIGIT_SEQ_QUA            = /[0-3]+/;
const DIGIT_SEQ_QUA__SEPARATOR = /([0-3]_?)*[0-3]/;
const DIGIT_SEQ_OCT            = /[0-7]+/;
const DIGIT_SEQ_OCT__SEPARATOR = /([0-7]_?)*[0-7]/;
const DIGIT_SEQ_DEC            = /[0-9]+/;
const DIGIT_SEQ_DEC__SEPARATOR = /([0-9]_?)*[0-9]/;
const DIGIT_SEQ_HEX            = /[0-9a-f]+/;
const DIGIT_SEQ_HEX__SEPARATOR = /([0-9a-f]_?)*[0-9a-f]/;
const DIGIT_SEQ_HTD            = /[0-9a-z]+/;
const DIGIT_SEQ_HTD__SEPARATOR = /([0-9a-z]_?)*[0-9a-z]/;

const INTEGER_DIGITS_RADIX = choice(
	seq('\\b',           DIGIT_SEQ_BIN),
	seq('\\q',           DIGIT_SEQ_QUA),
	seq('\\o',           DIGIT_SEQ_OCT),
	seq(optional('\\d'), DIGIT_SEQ_DEC),
	seq('\\x',           DIGIT_SEQ_HEX),
	seq('\\z',           DIGIT_SEQ_HTD),
);
const INTEGER_DIGITS_RADIX__SEPARATOR = choice(
	seq('\\b',           DIGIT_SEQ_BIN__SEPARATOR),
	seq('\\q',           DIGIT_SEQ_QUA__SEPARATOR),
	seq('\\o',           DIGIT_SEQ_OCT__SEPARATOR),
	seq(optional('\\d'), DIGIT_SEQ_DEC__SEPARATOR),
	seq('\\x',           DIGIT_SEQ_HEX__SEPARATOR),
	seq('\\z',           DIGIT_SEQ_HTD__SEPARATOR),
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
const COMMENTER_MULTI    = '%%';

/* eslint-disable function-call-argument-newline */
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
/* eslint-enable function-call-argument-newline */

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
 * (condition) ? consequent : alternative
 * ```
 * @param condition   the condition to test
 * @param consequent  if condition is true, this will be produced
 * @returns           either `consequent` or `blank()` based on `condition`
 */
function iff(condition: boolean, consequent: RuleOrLiteral): RuleOrLiteral {
	return (condition) ? consequent : blank();
}
function ifSpread(condition: boolean, consequent: RuleOrLiteral): RuleOrLiteral[] {
	return (condition) ? [consequent] : [];
}
function repCom1(production: RuleOrLiteral): SeqRule {
	return seq(repeat(seq(production, ',')), production);
}
function repCom(production: RuleOrLiteral): ChoiceRule {
	return optional(repCom1(production));
}



module.exports = grammar({
	/* eslint-disable arrow-parens */
	name: 'counterpoint',

	rules: {
		source_file: $ => optional($.block),



		/* # LEXICON */
		keyword_type: _$ => token(choice(
			'void',
			'bool',
			'int',
			'float',
			'str',
			'obj',
		)),
		keyword_value: _$ => token(choice(
			'null',
			'false',
			'true',
		)),

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
				         (!separator) ? DIGIT_SEQ_DEC : DIGIT_SEQ_DEC__SEPARATOR,
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
		word: $ => choice(
			// operator
			'mutable',
			'is',
			'isnt',
			'if',
			'then',
			'else',
			// storage
			'type',
			'let',
			// modifier
			'unfixed',
			$.keyword_type,
			$.keyword_value,
			$.identifier,
		),

		primitive_literal: $ => choice(
			$.keyword_value,
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
		),


		/* ## Types */
		...parameterize('entry_type', ({named, optional, variable}) => (
			$ => seq(iff(named, seq($.word, iff(!optional, ':'))), iff(optional, '?:'), $[call('_type', {variable})])
		), 'named', 'optional', 'variable'),

		...parameterize('_items_type', ({variable}) => $ => choice(
			             seq(repCom1($[call('entry_type', {variable})]), OPT_COM),
			seq(optional(seq(repCom1($[call('entry_type', {variable})]), ','    )), repCom1($[call('entry_type', 'optional', {variable})]), OPT_COM),
		), 'variable'),

		...parameterize('_properties_type', ({variable}) => $ => seq(repCom1(choice($[call('entry_type', 'named', {variable})], $[call('entry_type', 'named', 'optional', {variable})])), OPT_COM), 'variable'),

		...parameterize('type_grouped',        ({variable}) => $ => seq(                    '(',                       $[call('_type',            {variable})],   ')'), 'variable'),
		...parameterize('type_tuple_literal',  ({variable}) => $ => seq(!variable ? '\\[' : '[', optional(seq(OPT_COM, $[call('_items_type',      {variable})])), ']'), 'variable'),
		...parameterize('type_record_literal', ({variable}) => $ => seq(!variable ? '\\[' : '[',              OPT_COM, $[call('_properties_type', {variable})],   ']'), 'variable'),
		type_dict_literal:                                     $ => seq(                    '[', ':', $._type__variable,                                           ']'),
		type_map_literal:                                      $ => seq(                    '{', $._type__variable, '->', $._type__variable,                       '}'),
		generic_arguments:                                     $ => seq(                    '<', OPT_COM, repCom1($._type__variable), OPT_COM,                     '>'),

		...parameterize('_type_unit', ({variable}) => $ => choice(
			$.keyword_type,
			$.identifier,
			$.primitive_literal,
			$[call('type_grouped', {variable})],
			$.type_tuple_literal,
			$.type_record_literal,
			...ifSpread(variable, $[call('type_tuple_literal',  {variable})]),
			...ifSpread(variable, $[call('type_record_literal', {variable})]),
			...ifSpread(variable, $.type_dict_literal),
			...ifSpread(variable, $.type_map_literal),
		), 'variable'),

		property_access_type: $ => seq('.', choice($.integer, $.word)),
		generic_call:         $ => seq('.', $.generic_arguments),

		...parameterize('_type_compound', ({variable}) => $ => choice(
			$[call('_type_unit', {variable})],
			alias($[call('type_compound_dfn', {variable})], $[call('type_compound', {variable})]),
		), 'variable'),
		...parameterize('type_compound_dfn', ({variable}) => $ => seq($[call('_type_compound', {variable})], choice($.property_access_type, $.generic_call)), 'variable'),

		...parameterize('_type_unary_symbol', ({variable}) => $ => choice(
			$[call('_type_compound', {variable})],
			alias($[call('type_unary_symbol_dfn', {variable})], $[call('type_unary_symbol', {variable})]),
		), 'variable'),
		...parameterize('type_unary_symbol_dfn', ({variable}) => $ => seq($[call('_type_unary_symbol', {variable})], choice(
			'?',
			'!',
			seq('\\[', $.integer, ']'),
			...ifSpread(variable, seq('[', optional($.integer), ']')),
			...ifSpread(variable, seq('{', '}')),
		)), 'variable'),

		...parameterize('_type_unary_keyword', ({variable}) => $ => choice(
			$[call('_type_unary_symbol', {variable})],
			alias($[call('type_unary_keyword_dfn', {variable})], $[call('type_unary_keyword', {variable})]),
		), 'variable'),
		...parameterize('type_unary_keyword_dfn', ({variable}) => $ => seq('mutable', $[call('_type_unary_keyword', {variable})]), 'variable'),

		...parameterize('_type_intersection', ({variable}) => $ => choice($[call('_type_unary_keyword', {variable})], alias($[call('type_intersection_dfn', {variable})], $[call('type_intersection', {variable})])), 'variable'),
		...parameterize('_type_union',        ({variable}) => $ => choice($[call('_type_intersection',  {variable})], alias($[call('type_union_dfn',        {variable})], $[call('type_union',        {variable})])), 'variable'),

		...parameterize('type_intersection_dfn', ({variable}) => $ => seq($[call('_type_intersection', {variable})], '&', $[call('_type_unary_keyword', {variable})]), 'variable'),
		...parameterize('type_union_dfn',        ({variable}) => $ => seq($[call('_type_union',        {variable})], '|', $[call('_type_intersection',  {variable})]), 'variable'),

		/* eslint-disable function-paren-newline */
		...parameterize('_type', ({variable}) => $ => choice(
			$[call('_type_union', {variable})],
		), 'variable'),
		/* eslint-enable function-paren-newline */


		/* ## Expressions */
		...parameterize('string_template', ({variable}) => $ => choice(
			$.template_full,
			seq($.template_head, optional($[call('_expression', {variable})]), repeat(seq($.template_middle, optional($[call('_expression', {variable})]))), $.template_tail),
		), 'variable'),

		...parameterize('property', ({variable}) => $ => seq($.word,                  '=',  $[call('_expression', {variable})]), 'variable'),
		case:                                       $ => seq($._expression__variable, '->', $._expression__variable),

		...parameterize('expression_grouped', ({variable}) => $ => seq(                    '(',                               $[call('_expression', {variable})],             ')'), 'variable'),
		...parameterize('tuple_literal',      ({variable}) => $ => seq(!variable ? '\\[' : '[', optional(seq(OPT_COM, repCom1($[call('_expression', {variable})]), OPT_COM)), ']'), 'variable'),
		...parameterize('record_literal',     ({variable}) => $ => seq(!variable ? '\\[' : '[',              OPT_COM, repCom1($[call('property',    {variable})]), OPT_COM,   ']'), 'variable'),
		set_literal:                                          $ => seq(                    '{', optional(seq(OPT_COM, repCom1($._expression__variable),            OPT_COM)), '}'),
		map_literal:                                          $ => seq(                    '{',              OPT_COM, repCom1($.case),                             OPT_COM,   '}'),
		function_arguments:                                   $ => seq(                    '(', optional(seq(OPT_COM, repCom1($._expression__variable),            OPT_COM)), ')'),

		...parameterize('_expression_unit', ({variable}) => $ => choice(
			$.identifier,
			$.primitive_literal,
			$[call('string_template',    {variable})],
			$[call('expression_grouped', {variable})],
			$.tuple_literal,
			$.record_literal,
			...ifSpread(variable, $[call('tuple_literal',  {variable})]),
			...ifSpread(variable, $[call('record_literal', {variable})]),
			...ifSpread(variable, $.set_literal),
			...ifSpread(variable, $.map_literal),
		), 'variable'),

		...parameterize('property_access', ({variable}) => $ => seq(choice('.', '?.', '!.'), choice($.integer, $.word, seq('[', $[call('_expression', {variable})], ']'))), 'variable'),
		property_assign:                                   $ => seq('.',                     choice($.integer, $.word, seq('[', $._expression__variable, ']'))),
		function_call:                                     $ => seq('.',                     optional($.generic_arguments), $.function_arguments),

		...parameterize('_expression_compound', ({variable}) => $ => choice(
			$[call('_expression_unit', {variable})],
			alias($[call('expression_compound_dfn', {variable})], $[call('expression_compound', {variable})]),
		), 'variable'),
		...parameterize('expression_compound_dfn', ({variable}) => $ => seq($[call('_expression_compound', {variable})], choice($[call('property_access', {variable})], $.function_call)), 'variable'),

		assignee: $ => choice(
			$.identifier,
			seq($._expression_compound__variable, $.property_assign),
		),

		...parameterize('_expression_unary_symbol', ({variable}) => $ => choice($[call('_expression_compound',     {variable})], alias($[call('expression_unary_symbol_dfn', {variable})], $[call('expression_unary_symbol', {variable})])), 'variable'),
		...parameterize('_expression_claim',        ({variable}) => $ => choice($[call('_expression_unary_symbol', {variable})], alias($[call('expression_claim_dfn',        {variable})], $[call('expression_claim',        {variable})])), 'variable'),

		...parameterize('expression_unary_symbol_dfn', ({variable}) => $ => seq(choice('!', '?', '+', '-'), $[call('_expression_unary_symbol', {variable})]), 'variable'),
		...parameterize('expression_claim_dfn',        ({variable}) => $ => seq('<', $._type, '>',          $[call('_expression_claim',        {variable})]), 'variable'),

		...parameterize('_expression_exponential',    ({variable}) => $ => choice($[call('_expression_claim',          {variable})], alias($[call('expression_exponential_dfn',    {variable})], $[call('expression_exponential',    {variable})])), 'variable'),
		...parameterize('_expression_multiplicative', ({variable}) => $ => choice($[call('_expression_exponential',    {variable})], alias($[call('expression_multiplicative_dfn', {variable})], $[call('expression_multiplicative', {variable})])), 'variable'),
		...parameterize('_expression_additive',       ({variable}) => $ => choice($[call('_expression_multiplicative', {variable})], alias($[call('expression_additive_dfn',       {variable})], $[call('expression_additive',       {variable})])), 'variable'),
		...parameterize('_expression_comparative',    ({variable}) => $ => choice($[call('_expression_additive',       {variable})], alias($[call('expression_comparative_dfn',    {variable})], $[call('expression_comparative',    {variable})])), 'variable'),
		...parameterize('_expression_equality',       ({variable}) => $ => choice($[call('_expression_comparative',    {variable})], alias($[call('expression_equality_dfn',       {variable})], $[call('expression_equality',       {variable})])), 'variable'),
		...parameterize('_expression_conjunctive',    ({variable}) => $ => choice($[call('_expression_equality',       {variable})], alias($[call('expression_conjunctive_dfn',    {variable})], $[call('expression_conjunctive',    {variable})])), 'variable'),
		...parameterize('_expression_disjunctive',    ({variable}) => $ => choice($[call('_expression_conjunctive',    {variable})], alias($[call('expression_disjunctive_dfn',    {variable})], $[call('expression_disjunctive',    {variable})])), 'variable'),

		...parameterize('expression_exponential_dfn',    ({variable}) => $ => seq($[call('_expression_claim',          {variable})], '^',                                                    $[call('_expression_exponential',    {variable})]), 'variable'),
		...parameterize('expression_multiplicative_dfn', ({variable}) => $ => seq($[call('_expression_multiplicative', {variable})], choice('*', '/'),                                       $[call('_expression_exponential',    {variable})]), 'variable'),
		...parameterize('expression_additive_dfn',       ({variable}) => $ => seq($[call('_expression_additive',       {variable})], choice('+', '-'),                                       $[call('_expression_multiplicative', {variable})]), 'variable'),
		...parameterize('expression_comparative_dfn',    ({variable}) => $ => seq($[call('_expression_comparative',    {variable})], choice('<', '>', '<=', '>=', '!<', '!>', 'is', 'isnt'), $[call('_expression_additive',       {variable})]), 'variable'),
		...parameterize('expression_equality_dfn',       ({variable}) => $ => seq($[call('_expression_equality',       {variable})], choice('===', '!==', '==', '!='),                       $[call('_expression_comparative',    {variable})]), 'variable'),
		...parameterize('expression_conjunctive_dfn',    ({variable}) => $ => seq($[call('_expression_conjunctive',    {variable})], choice('&&', '!&'),                                     $[call('_expression_equality',       {variable})]), 'variable'),
		...parameterize('expression_disjunctive_dfn',    ({variable}) => $ => seq($[call('_expression_disjunctive',    {variable})], choice('||', '!|'),                                     $[call('_expression_conjunctive',    {variable})]), 'variable'),

		...parameterize('expression_conditional', ({variable}) => $ => seq('if', $[call('_expression', {variable})], 'then', $[call('_expression', {variable})], 'else', $[call('_expression', {variable})]), 'variable'),

		...parameterize('_expression', ({variable}) => $ => choice(
			$[call('_expression_disjunctive', {variable})],
			$[call('expression_conditional',  {variable})],
		), 'variable'),


		/* ## Statements */
		declaration_type:     $ => seq('type',                      $.identifier, '=', $._type__variable,                               ';'),
		declaration_variable: $ => seq('let',  optional('unfixed'), $.identifier, ':', $._type__variable, '=', $._expression__variable, ';'),

		_declaration: $ => choice(
			$.declaration_type,
			$.declaration_variable,
		),

		statement_expression: $ => seq(optional($._expression__variable), ';'),

		statement_assignment: $ => seq($.assignee, '=', $._expression__variable, ';'),

		_statement: $ => choice(
			$._declaration,
			$.statement_expression,
			$.statement_assignment,
		),

		block: $ => seq('{', repeat1($._statement), '}'),
	},

	extras: _$ => [
		/(\u0020|\t|\n)+/, // whitespace
		token(choice(
			/%([^%\n][^\n]*)?\n/, // line comment
			/%%(%?[^%])*%%/,      // multiline comment
		)),
	],

	/**
	 * Tries to match `$.identifier` first before matching any keyword literals in the grammar.
	 * @see https://tree-sitter.github.io/tree-sitter/creating-parsers#keyword-extraction
	 */
	word: $ => $.identifier,

	conflicts: $ => [
		familyNameAll('_type_unit',       ['variable']).map((rule_name) => $[rule_name]),
		familyNameAll('string_template',  ['variable']).map((rule_name) => $[rule_name]),
		familyNameAll('_expression_unit', ['variable']).map((rule_name) => $[rule_name]),
	],

	supertypes: $ => [
		$._type_unit,
		$._type,
		$._expression_unit,
		$._expression_unit__variable,
		$._expression,
		$._expression__variable,
		$._declaration,
		$._statement,
	],
	/* eslint-enable arrow-parens */
});
