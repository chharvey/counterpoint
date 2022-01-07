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
 * @param parameterized_rule a rule for the production
 * @param params             a set of stringified parameters
 * @returns                  an object of newly generated rules
 */
function parameterize(family_name, parameterized_rule, ...params) {
	const rules_obj = {};
	new Map([...new Array(2 ** params.length)].map((_, nth) => {      // e.g. `['await', 'static', 'instance', 'method']`
		const args = [...nth.toString(2).padStart(params.length, '0')] // e.g. (if `nth` is 5 out of 15) `[0, 1, 0, 1]`
			.map((bit, i) => [params[i], !!+bit])                       // `[['await', false],  ['static', true],  ['instance', false],  ['method', true]]`
			.filter(([_param, to_include]) => !!to_include)             // `[['static', true],  ['method', true]]`
			.map(([param, _to_include]) => param);                      // `['static', 'method']`
		const args_obj = {};
		args.forEach((arg) => {
			args_obj[arg] = true;
		}); // `{static: true, method: true}`
		return [
			family_name.concat((args.length) ? `__${ args.join('__') }` : ''), // 'family_name__static__method'
			parameterized_rule.call(null, args_obj),
		];
	})).forEach((rule, name) => {
		rules_obj[name] = rule;
	});
	return rules_obj;
}
/**
 * References a production with arguments.
 * E.g., to generate the following EBNF item:
 * ```ebnf
 * Item<+ParamA><+ParamB><-ParamC><?ParamD>
 * ```
 * we can call:
 * ```js
 * $[call('item', {param_d}, 'param_a', 'param_b')]
 * ```
 * @param family_name the name of the production without parameters
 * @param first_arg   an object of inherited argument values from the containing production
 * @param rest_args   any further true stringified arguments
 * @returns           a property name of the `$` object
 */
function call(family_name, first_arg = {}, ...rest_args) {
	if (typeof first_arg === 'string') {
		rest_args.push(first_arg);
		first_arg = {};
	}
	rest_args.forEach((arg) => {
		first_arg[arg] = true;
	});
	const args_arr = Object.entries(first_arg)
		.filter(([_,    is_true]) => is_true)
		.map   (([name, _])       => name);
	return family_name.concat((args_arr.length) ? `__${ args_arr.join('__') }` : '');
}



/* # LEXER HELPERS */
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

const STRING_ESCAPE = choice(
	'\'', '\\',
	's', 't', 'n', 'r',
	seq('u{', optional(DIGIT_SEQ_HEX), '}'),
	'\n',
	/[^'\\stnru\n]/,
);
const STRING_ESCAPE__COMMENT = choice(
	'\'', '\\', '%',
	's', 't', 'n', 'r',
	seq('u{', optional(DIGIT_SEQ_HEX), '}'),
	'\n',
	/[^'\\%stnru\n]/,
);
const STRING_ESCAPE__SEPARATOR = choice(
	'\'', '\\',
	's', 't', 'n', 'r',
	seq('u{', optional(DIGIT_SEQ_HEX__SEPARATOR), '}'),
	'\n',
	/[^'\\stnru\n]/,
);
const STRING_ESCAPE__COMMENT_SEPARATOR = choice(
	'\'', '\\', '%',
	's', 't', 'n', 'r',
	seq('u{', optional(DIGIT_SEQ_HEX__SEPARATOR), '}'),
	'\n',
	/[^'\\%stnru\n]/,
);

const STRING_CHAR = choice(
	/[^'\\]/,
	seq('\\', STRING_ESCAPE),
	/\\u[^'{]/,
);
const STRING_CHAR__COMMENT = choice(
	/[^'\\%]/,
	seq('\\', STRING_ESCAPE__COMMENT),
	/\\u[^'{]/,
	/%([^'%\n][^'\n]*)?\n/,
	/%%(%?[^'%])*%%/,
);
const STRING_CHAR__SEPARATOR = choice(
	/[^'\\]/,
	seq('\\', STRING_ESCAPE__SEPARATOR),
	/\\u[^'{]/,
);
const STRING_CHAR__COMMENT__SEPARATOR = choice(
	/[^'\\%]/,
	seq('\\', STRING_ESCAPE__COMMENT_SEPARATOR),
	/\\u[^'{]/,
	/%([^'%\n][^'\n]*)?\n/,
	/%%(%?[^'%])*%%/,
);

const STRING_CHARS                     = repeat1(STRING_CHAR);
const STRING_CHARS__COMMENT            = repeat1(STRING_CHAR__COMMENT);
const STRING_CHARS__SEPARATOR          = repeat1(STRING_CHAR__SEPARATOR);
const STRING_CHARS__COMMENT__SEPARATOR = repeat1(STRING_CHAR__COMMENT__SEPARATOR);

const STRING_UNFINISHED          = '\\u';
const STRING_UNFINISHED__COMMENT = choice('\\u', /%([^'%\n][^'\n]*)?/, /%%(%?[^'%])*/);

const TEMPLATE_CHARS_NO_END = choice(
	/[^'{]/,
	/('\{|''\{)*('|'')[^'{]/,
	/('\{|''\{)+[^'{]/,
	/(\{'|\{'')*\{[^'{]/,
	/(\{'|\{'')+[^'{]/,
);
const TEMPLATE_CHARS_END_DELIM = seq(repeat(TEMPLATE_CHARS_NO_END), choice(
	/[^'{]/,
	/('\{|''\{)*('|'')[^'{]/,
	/('\{|''\{)+[^'{]?/,
	/(\{'|\{'')*\{[^'{]?/,
	/(\{'|\{'')+[^'{]/,
));
const TEMPLATE_CHARS_END_INTERP = seq(repeat(TEMPLATE_CHARS_NO_END), choice(
	/[^'{]/,
	/('\{|''\{)*('|'')[^'{]?/,
	/('\{|''\{)+[^'{]/,
	/(\{'|\{'')*\{[^'{]/,
	/(\{'|\{'')+[^'{]?/,
));



/* # PARSER HELPERS */
const OPT_COM = optional(',');

/**
 * Reference a rule based on a condition.
 * @param condition   the condition to test
 * @param consequent  if condition is true, this will be produced
 * @param alternative if condition is false, this will be
 *                    @default blank()
 * @returns           either `consequent` or `alternative` based on `condition`
 */
function iff(condition, consequent, alternative = blank()) {
	return (!!condition) ? consequent : alternative;
}
function repCom(production) {
	return optional(repCom1(production));
}
function repCom1(production) {
	return seq(repeat(seq(production, ',')), production);
}



module.exports = grammar({
	name: 'counterpoint',

	rules: {
		source_file: $ => repeat($.statement),



		/* # LEXICON */
		keyword_type: $ => token(choice(
			'void',
			'bool',
			'int',
			'float',
			'str',
			'obj',
		)),
		keyword_value: $ => token(choice(
			'null',
			'false',
			'true',
		)),
		keyword_other: $ => token(choice(
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
		)),

		identifier: $ => token(choice(
			/[A-Za-z_][A-Za-z0-9_]*/,
			/`[^`]*`/
		)),

		integer:                   $ => token(seq(/[+-]?/, DIGIT_SEQ_DEC)),
		integer__radix:            $ => token(seq(/[+-]?/, INTEGER_DIGITS_RADIX)),
		integer__separator:        $ => token(seq(/[+-]?/, DIGIT_SEQ_DEC__SEPARATOR)),
		integer__radix__separator: $ => token(seq(/[+-]?/, INTEGER_DIGITS_RADIX__SEPARATOR)),

		float:            $ => token(seq(SIGNED_DIGIT_SEQ_DEC,            '.', optional(seq(DIGIT_SEQ_DEC,            optional(EXPONENT_PART))))),
		float__separator: $ => token(seq(SIGNED_DIGIT_SEQ_DEC__SEPARATOR, '.', optional(seq(DIGIT_SEQ_DEC__SEPARATOR, optional(EXPONENT_PART__SEPARATOR))))),

		string:                     $ => token(seq('\'', optional(STRING_CHARS),                     optional(STRING_UNFINISHED),          '\'')),
		string__comment:            $ => token(seq('\'', optional(STRING_CHARS__COMMENT),            optional(STRING_UNFINISHED__COMMENT), '\'')),
		string__separator:          $ => token(seq('\'', optional(STRING_CHARS__SEPARATOR),          optional(STRING_UNFINISHED),          '\'')),
		string__comment__separator: $ => token(seq('\'', optional(STRING_CHARS__COMMENT__SEPARATOR), optional(STRING_UNFINISHED__COMMENT), '\'')),

		template_full:   $ => token(seq('\'\'\'', optional(TEMPLATE_CHARS_END_DELIM),  '\'\'\'')),
		template_head:   $ => token(seq('\'\'\'', optional(TEMPLATE_CHARS_END_INTERP), '{{')),
		template_middle: $ => token(seq('}}',     optional(TEMPLATE_CHARS_END_INTERP), '{{')),
		template_tail:   $ => token(seq('}}',     optional(TEMPLATE_CHARS_END_DELIM),  '\'\'\'')),



		/* # SYNTAX */
		word: $ => choice(
			$.keyword_type,
			$.keyword_value,
			$.keyword_other,
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
		...parameterize('entry_type', ({named, optional}) => (
			$ => seq(iff(named, seq($.word, iff(!optional, ':'))), iff(optional, '?:'), $.type)
		), 'named', 'optional'),

		items_type: $ => choice(
			             seq(repCom1($.entry_type), OPT_COM),
			seq(optional(seq(repCom1($.entry_type), ','    )), repCom1($.entry_type__optional), OPT_COM),
		),

		properties_type: $ => seq(repCom1(choice($.entry_type__named, $.entry_type__named__optional)), OPT_COM),

		type_tuple_literal:  $ => seq('[', optional(seq(OPT_COM, $.items_type)),    ']'),
		type_record_literal: $ => seq('[',              OPT_COM, $.properties_type, ']'),
		type_hash_literal:   $ => seq('[', ':', $.type,                             ']'),
		type_map_literal:    $ => seq('{', $.type, '->', $.type,                    '}'),
		generic_arguments:   $ => seq('<', OPT_COM, repCom1($.type), OPT_COM,       '>'),

		type_unit: $ => choice(
			$.keyword_type,
			$.identifier,
			$.primitive_literal,
			$.type_tuple_literal,
			$.type_record_literal,
			$.type_hash_literal,
			$.type_map_literal,
			seq('(', $.type, ')'),
		),

		property_access_type: $ => seq('.', choice($.integer, $.word)),
		generic_call:         $ => seq('.', $.generic_arguments),

		type_compound: $ => choice(
			$.type_unit,
			seq($.type_compound, choice($.property_access_type, $.generic_call)),
		),

		type_unary_symbol: $ => choice(
			$.type_compound,
			seq($.type_unary_symbol, choice('?', '!', seq('[', optional($.integer), ']'), seq('{', '}'))),
		),

		type_unary_keyword: $ => choice(
			$.type_unary_symbol,
			seq('mutable', $.type_unary_keyword),
		),

		type_intersection: $ => seq(optional(seq($.type_intersection, '&')), $.type_unary_keyword),
		type_union:        $ => seq(optional(seq($.type_union,        '|')), $.type_intersection),

		type: $ => choice(
			$.type_union,
		),


		/* ## Expressions */
		string_template: $ => choice(
			$.template_full,
			seq($.template_head, optional($.expression), repeat(seq($.template_middle, optional($.expression))), $.template_tail),
		),

		property: $ => seq($.word,       '=',  $.expression),
		case:     $ => seq($.expression, '->', $.expression),

		tuple_literal:      $ => seq('[', optional(seq(OPT_COM, repCom1($.expression), OPT_COM)), ']'),
		record_literal:     $ => seq('[',              OPT_COM, repCom1($.property),   OPT_COM,   ']'),
		set_literal:        $ => seq('{', optional(seq(OPT_COM, repCom1($.expression), OPT_COM)), '}'),
		map_literal:        $ => seq('{',              OPT_COM, repCom1($.case),       OPT_COM,   '}'),
		function_arguments: $ => seq('(', optional(seq(OPT_COM, repCom1($.expression), OPT_COM)), ')'),

		expression_unit: $ => choice(
			$.identifier,
			$.primitive_literal,
			$.string_template,
			$.tuple_literal,
			$.record_literal,
			$.set_literal,
			$.map_literal,
			seq('(', $.expression, ')'),
		),

		property_access: $ => seq(choice('.', '?.', '!.'), choice($.integer, $.word, seq('[', $.expression, ']'))),
		property_assign: $ => seq('.',                     choice($.integer, $.word, seq('[', $.expression, ']'))),
		function_call:   $ => seq('.',                     optional($.generic_arguments), $.function_arguments),

		expression_compound: $ => choice(
			$.expression_unit,
			seq($.expression_compound, choice($.property_access, $.function_call)),
		),

		assignee: $ => choice(
			$.identifier,
			seq($.expression_compound, $.property_assign),
		),

		expression_unary_symbol: $ => choice(
			$.expression_compound,
			seq(/!|\?|\+|-/, $.expression_unary_symbol),
		),

		expression_exponential: $ => seq($.expression_unary_symbol, optional(seq('^', $.expression_exponential))),

		expression_multiplicative: $ => seq(optional(seq($.expression_multiplicative, /[*/]/)),                                      $.expression_exponential),
		expression_additive:       $ => seq(optional(seq($.expression_additive,       /[+-]/)),                                      $.expression_multiplicative),
		expression_comparative:    $ => seq(optional(seq($.expression_comparative,    choice(/[<>]/, /<=|>=|!<|!>/, 'is', 'isnt'))), $.expression_additive),
		expression_equality:       $ => seq(optional(seq($.expression_equality,       /===|!==|==|!=/)),                             $.expression_comparative),
		expression_conjunctive:    $ => seq(optional(seq($.expression_conjunctive,    /&&|!&/)),                                     $.expression_equality),
		expression_disjunctive:    $ => seq(optional(seq($.expression_disjunctive,    /\|\||!\|/)),                                  $.expression_conjunctive),

		expression_conditional: $ => seq('if', $.expression, 'then', $.expression, 'else', $.expression),

		expression: $ => choice(
			$.expression_disjunctive,
			$.expression_conditional,
		),


		/* ## Statements */
		declaration_type:     $ => seq('type',                      $.identifier, '=', $.type,                    ';'),
		declaration_variable: $ => seq('let',  optional('unfixed'), $.identifier, ':', $.type, '=', $.expression, ';'),

		declaration: $ => choice(
			$.declaration_type,
			$.declaration_variable,
		),

		statement_assignment: $ => seq($.assignee, '=', $.expression, ';'),

		statement: $ => choice(
			seq(optional($.expression), ';'),
			$.declaration,
			$.statement_assignment,
		),
	},

	extras: $ => [
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
});
