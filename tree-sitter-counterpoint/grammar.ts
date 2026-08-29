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
			parameterized_rule(args_obj),
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
function rg(s: string | RegExp): RegExp { // s -> (s)
	return new RegExp(`(${ typeof s === 'string' ? RegExp.escape(s) : s.source })`);
}
function ro(s: string | RegExp): RegExp { // s -> (s)?
	return new RegExp(rg(s).source.concat('?'));
}
function rr0(s: string | RegExp): RegExp { // s -> (s)*
	return new RegExp(rg(s).source.concat('*'));
}
function rr1(s: string | RegExp): RegExp { // s -> (s)+
	return new RegExp(rg(s).source.concat('+'));
}
function rs(...ss: readonly (string | RegExp)[]): RegExp { // s,t -> (s)(t)
	return new RegExp(ss.map((s) => rg(s).source).join(''));
}
function rc(...ss: readonly (string | RegExp)[]): RegExp { // s,t -> (s)|(t)
	return new RegExp(ss.map((s) => rg(s).source).join('|'));
}

const WORD_BASIC   = /[A-Za-z][A-Za-z0-9_]*|_[A-Za-z0-9_]+/;
const WORD_UNICODE = /'[^']*'/;

const DIGIT_SEQ_BIN = /([0-1]_?)*[0-1]/;
const DIGIT_SEQ_QUA = /([0-3]_?)*[0-3]/;
const DIGIT_SEQ_SEX = /([0-5]_?)*[0-5]/;
const DIGIT_SEQ_OCT = /([0-7]_?)*[0-7]/;
const DIGIT_SEQ_DEC = /([0-9]_?)*[0-9]/;
const DIGIT_SEQ_HEX = /([0-9a-f]_?)*[0-9a-f]/;
const DIGIT_SEQ_NIF = /([0-9a-z]_?)*[0-9a-z]/;

const WHOLE_DIGITS = rc(
	rs('\\b',     DIGIT_SEQ_BIN),
	rs('\\q',     DIGIT_SEQ_QUA),
	rs('\\s',     DIGIT_SEQ_SEX),
	rs('\\o',     DIGIT_SEQ_OCT),
	rs(ro('\\d'), DIGIT_SEQ_DEC),
	rs('\\x',     DIGIT_SEQ_HEX),
	rs('\\z',     DIGIT_SEQ_NIF),
);

const SIGNED_DIGIT_SEQ_DEC = rs(/[+-]?/, DIGIT_SEQ_DEC);

const EXPONENT_PART = rs('e', SIGNED_DIGIT_SEQ_DEC);

const ESCAPER            = '\\';
const DELIM_STRING       = '"';
const DELIM_TEMPLATE     = '"""';
const DELIM_INTERP_START = '{{';
const DELIM_INTERP_END   = '}}';
const COMMENTER_LINE     = '%';

const STRING_ESCAPE = rc(
	DELIM_STRING,
	ESCAPER,
	COMMENTER_LINE,
	's', 't', 'n', 'r', // eslint-disable-line @stylistic/function-call-argument-newline
	rs('u{', ro(DIGIT_SEQ_HEX), '}'),
	'\n',
	/[^"\\%stnru\n]/,
);

const STRING_CHAR = rc(
	/[^"\\%]/,
	rs(ESCAPER, STRING_ESCAPE),
	/\\u[^"{]/,
	/%([^"%\n][^"\n]*)?\n/,
	/%%(%?[^"%])*%%/,
);

const STRING_CHARS = rr1(STRING_CHAR);

const STRING_UNFINISHED = rc(
	'\\u',
	/%([^"%\n][^"\n]*)?/,
	/%%(%?[^"%])*/,
);

const TEMPLATE_CHARS_NO_END = rc(
	/[^"{]/,
	/("\{|""\{)*("|"")[^"{]/,
	/("\{|""\{)+[^"{]/,
	/(\{"|\{"")*\{[^"{]/,
	/(\{"|\{"")+[^"{]/,
);
const TEMPLATE_CHARS_END_DELIM = rs(rr0(TEMPLATE_CHARS_NO_END), rc(
	/[^"{]/,
	/("\{|""\{)*("|"")[^"{]/,
	/("\{|""\{)+[^"{]?/,
	/(\{"|\{"")*\{[^"{]?/,
	/(\{"|\{"")+[^"{]/,
));
const TEMPLATE_CHARS_END_INTERP = rs(rr0(TEMPLATE_CHARS_NO_END), rc(
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
 * 	...parameterize('entry_type__optional', ({named}) => $ => seq(...iff(named, $.word), '?', ':', $._type), 'named'),
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

		/*
		 * TODO: Implement the doc-comment system.
		 * 1. Rename `$._comment` to `$.comment` here and in `extras` to make them queryable.
		 * 2. To prevent these new nodes from cluttering existing logic, update `AST.Goal.fromSource` to use a Proxy.
		 * 3. The Proxy must intercept the following getters to filter out `'comment'` types:
		 * 	- `.children` & `.namedChildren`: Should return `.filter((n) => !n.isExtra)`
		 * 	- `.childCount` & `.namedChildCount`: Should return the length of the filtered arrays.
		 * This preserves an “optimized” view for the Decorator while allowing a documentation generator
		 * to extract comments via Tree-Sitter queries.
		 */
		_comment: _$ => token(choice(
			/%([^%\n][^\n]*)?\n/, // line comment
			/%%(%?[^%])*%%/,      // block comment
		)),



		/* # LEXICON */
		identifier: _$ => token(rc(
			WORD_BASIC,
			WORD_UNICODE,
		)),

		integer: _$ => token(rs(/-?/, WHOLE_DIGITS)),
		natural: _$ => token(rs('+',  WHOLE_DIGITS)),

		float: _$ => token(rs(
			SIGNED_DIGIT_SEQ_DEC,
			'.',
			DIGIT_SEQ_DEC,
			ro(EXPONENT_PART),
		)),

		string: _$ => token(rs(
			DELIM_STRING,
			ro(STRING_CHARS),
			ro(STRING_UNFINISHED),
			DELIM_STRING,
		)),

		template_full:   _$ => token(rs(DELIM_TEMPLATE,   ro(TEMPLATE_CHARS_END_DELIM),  DELIM_TEMPLATE)),
		template_head:   _$ => token(rs(DELIM_TEMPLATE,   ro(TEMPLATE_CHARS_END_INTERP), DELIM_INTERP_START)),
		template_middle: _$ => token(rs(DELIM_INTERP_END, ro(TEMPLATE_CHARS_END_INTERP), DELIM_INTERP_START)),
		template_tail:   _$ => token(rs(DELIM_INTERP_END, ro(TEMPLATE_CHARS_END_DELIM),  DELIM_TEMPLATE)),



		/* # SYNTAX */
		keyword_type: _$ => choice(
			'nothing',
			'bool',
			'sym',
			'int',
			'nat',
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
			'if',
			'then',
			'else',
			'switch',
			'case',
			'default',
			// storage
			'type',
			'val',
			'func',
			'claim',
			'set',
			'delete',
			'_',
			'void',
			// modifier
			'nominal',
			// control
			'unless',
			'while',
			'until',
			'for',
			'in',
			'do',
			'break',
			'skip',
			'return',
			$.identifier,
			$.keyword_type,
			$.keyword_value,
		),

		primitive_literal: $ => choice(
			$.integer,
			$.natural,
			$.float,
			$.string,
			$.keyword_value,
			seq('@', $.word),
		),


		/* ## Types */
		...parameterize('entry_type', ({named, optional}) => (
			$ => seq(...iff(named, seq(field('word_0', $.word), ...iff(!optional, ':'))), ...iff(optional, seq('?', ':')), field('type_0', $._type))
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

		_parameters_type: $ => {
			const LIST_ENT_NAM: SeqRule = repCom1(call($, 'entry_type', 'named'));
			return choice(
				seq(OPT_COM, repCom1($.entry_type), optional(seq(',', LIST_ENT_NAM)), OPT_COM),
				seq(OPT_COM,                                          LIST_ENT_NAM,   OPT_COM),
			);
		},

		property_accessor_type: $ => choice($.integer, $.natural, $.word),

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

		type_compound: $ => prec(5, seq(field('type_0', $._type), choice(
			seq(choice('.', '?.'), field('property_accessor_type_0', $.property_accessor_type)),
			seq('.',               field('generic_arguments_0',      $.generic_arguments)),
		))),

		type_unary_symbol:  $ => prec(4, seq($._type, choice('?', '!'))),
		type_unary_keyword: $ => prec(3, seq('mut', $._type)),

		type_intersection: $ => prec.left(2, seq($._type, '&', $._type)),
		type_union:        $ => prec.left(1, seq($._type, '|', $._type)),

		type_function: $ => seq('\\', '(', optional($._parameters_type), ')', '=>', choice('void', field('type_0', $._type))),

		_type: $ => choice(
			$._type_unit,

			// once parameterized, alias these:
			$.type_compound,
			$.type_unary_symbol,
			$.type_unary_keyword,
			$.type_intersection,
			$.type_union,

			$.type_function,
		),


		/* ## Expressions */
		...parameterize('string_template', ({break: brk, return: rtn}) => $ => choice(
			$.template_full,
			seq($.template_head, optional(call($, '_expression', 'block', {break: brk}, {return: rtn})), repeat(seq($.template_middle, optional(call($, '_expression', 'block', {break: brk}, {return: rtn})))), $.template_tail),
		), 'break', 'return'),

		...parameterize('_items', ({break: brk, return: rtn}) => $ => choice(
			seq(         call($, '_expression', 'block', {break: brk}, {return: rtn}),  ','),
			seq(optional(call($, '_expression', 'block', {break: brk}, {return: rtn})), ',', repCom1(call($, '_expression', 'block', {break: brk}, {return: rtn})), OPT_COM),
		), 'break', 'return'),

		...parameterize('property',    ({break: brk, return: rtn}) => $ => seq(                                                                                        $.word,                                                       '=',  call($, '_expression', 'block', {break: brk}, {return: rtn})), 'break', 'return'),
		...parameterize('case_map',    ({break: brk, return: rtn}) => $ => seq(                                                                                        call($, '_expression', 'block', {break: brk}, {return: rtn}), '->', call($, '_expression', 'block', {break: brk}, {return: rtn})), 'break', 'return'),
		...parameterize('case_switch', ({break: brk, return: rtn}) => $ => seq('case', repeat(seq(call($, '_expression', 'block', {break: brk}, {return: rtn}), '|')), call($, '_expression', 'block', {break: brk}, {return: rtn}), '->', call($, '_expression', 'block', {break: brk}, {return: rtn})), 'break', 'return'),

		...parameterize('parameter_function', ({named}) => $ => seq(choice(
			seq(...iff(named, seq(field('word_0', $.word), '=')), choice('_', seq(optional(field('mut_0', 'mut')), field('identifier_0', $.identifier)))),
			...iff(named, seq(optional(field('mut_0', 'mut')), field('pun_0', '$'), field('identifier_0', $.identifier))),
		), ':', field('type_0', $._type)), 'named'),

		_parameters_function: $ => {
			const LIST_PARAM_NAM: SeqRule = repCom1(call($, 'parameter_function', 'named'));
			return choice(
				seq(OPT_COM, repCom1($.parameter_function), optional(seq(',', LIST_PARAM_NAM)), OPT_COM),
				seq(OPT_COM,                                                  LIST_PARAM_NAM,   OPT_COM),
			);
		},

		...parameterize('property_accessor', ({break: brk, return: rtn}) => $ => choice($.integer, $.natural, $.word, seq('[', call($, '_expression', 'block', {break: brk}, {return: rtn}), ']')), 'break', 'return'),

		...parameterize('expression_grouped',        ({break: brk, return: rtn}) => $ => seq('(',                               call($, '_expression', 'block', {break: brk}, {return: rtn}),             ')'), 'break', 'return'),
		...parameterize('expression_tuple_literal',  ({break: brk, return: rtn}) => $ => seq('(', optional(                     call($, '_items',               {break: brk}, {return: rtn})           ), ')'), 'break', 'return'),
		...parameterize('expression_record_literal', ({break: brk, return: rtn}) => $ => seq('(',              OPT_COM, repCom1(call($, 'property',             {break: brk}, {return: rtn})), OPT_COM,   ')'), 'break', 'return'),
		...parameterize('expression_list_literal',   ({break: brk, return: rtn}) => $ => seq('[', optional(seq(OPT_COM, repCom1(call($, '_expression', 'block', {break: brk}, {return: rtn})), OPT_COM)), ']'), 'break', 'return'),
		...parameterize('expression_dict_literal',   ({break: brk, return: rtn}) => $ => seq('[',              OPT_COM, repCom1(call($, 'property',             {break: brk}, {return: rtn})), OPT_COM,   ']'), 'break', 'return'),
		...parameterize('expression_set_literal',    ({break: brk, return: rtn}) => $ => seq('{', optional(seq(OPT_COM, repCom1(call($, '_expression', 'block', {break: brk}, {return: rtn})), OPT_COM)), '}'), 'break', 'return'),
		...parameterize('expression_map_literal',    ({break: brk, return: rtn}) => $ => seq('{',              OPT_COM, repCom1(call($, 'case_map',             {break: brk}, {return: rtn})), OPT_COM,   '}'), 'break', 'return'),
		...parameterize('function_arguments',        ({break: brk, return: rtn}) => $ => seq('(', optional(seq(OPT_COM, repCom1(call($, '_expression', 'block', {break: brk}, {return: rtn})), OPT_COM)), ')'), 'break', 'return'),

		...parameterize('_expression_unit', ({block, break: brk, return: rtn}) => $ => choice(
			$.identifier,
			$.primitive_literal,
			call($, 'string_template',           {break: brk}, {return: rtn}),
			call($, 'expression_grouped',        {break: brk}, {return: rtn}),
			call($, 'expression_tuple_literal',  {break: brk}, {return: rtn}),
			call($, 'expression_record_literal', {break: brk}, {return: rtn}),
			call($, 'expression_list_literal',   {break: brk}, {return: rtn}),
			call($, 'expression_dict_literal',   {break: brk}, {return: rtn}),
			call($, 'expression_set_literal',    {break: brk}, {return: rtn}),
			call($, 'expression_map_literal',    {break: brk}, {return: rtn}),
			...iff(block, alias(call($, 'block', {break: brk}, {return: rtn}), $.expression_block)),
		), 'block', 'break', 'return'),

		...parameterize('expression_compound', ({block, break: brk, return: rtn}) => $ => prec(10, seq(field('expression_0', call($, '_expression', {block}, {break: brk}, {return: rtn})), choice(
			'~?',
			'~!',
			seq(choice('.', '?.', '!.'), field('property_accessor_0', call($, 'property_accessor', {break: brk}, {return: rtn}))),
			seq('.',                     optional(field('generic_arguments_0', $.generic_arguments)), field('function_arguments_0', call($, 'function_arguments', {break: brk}, {return: rtn}))),
		))), 'block', 'break', 'return'),

		...parameterize('expression_unary_symbol', ({block, break: brk, return: rtn}) => $ => prec(9, seq(choice('!', '?', '+', '-'), call($, '_expression', {block}, {break: brk}, {return: rtn}))), 'block', 'break', 'return'),

		...parameterize('expression_cast', ({block, break: brk, return: rtn}) => $ => choice(
			prec.left(8, seq(field('expression_0', call($, '_expression', {block}, {break: brk}, {return: rtn})), choice('as', 'as?', 'as!'), field('expression_1', call($, '_expression', {block}, {break: brk}, {return: rtn})))),
			prec(8,      seq(field('expression_0', call($, '_expression', {block}, {break: brk}, {return: rtn})), 'as',                       '<', field('type_0', $._type), '>')),
		), 'block', 'break', 'return'),

		...parameterize('expression_exponential',    ({block, break: brk, return: rtn}) => $ => prec.right(7, seq(call($, '_expression', {block}, {break: brk}, {return: rtn}), '^',                                                   call($, '_expression', {block}, {break: brk}, {return: rtn}))), 'block', 'break', 'return'),
		...parameterize('expression_multiplicative', ({block, break: brk, return: rtn}) => $ => prec.left (6, seq(call($, '_expression', {block}, {break: brk}, {return: rtn}), choice('*', '/'),                                      call($, '_expression', {block}, {break: brk}, {return: rtn}))), 'block', 'break', 'return'),
		...parameterize('expression_additive',       ({block, break: brk, return: rtn}) => $ => prec.left (5, seq(call($, '_expression', {block}, {break: brk}, {return: rtn}), choice('+', '-'),                                      call($, '_expression', {block}, {break: brk}, {return: rtn}))), 'block', 'break', 'return'),
		...parameterize('expression_comparative',    ({block, break: brk, return: rtn}) => $ => prec.left (4, seq(call($, '_expression', {block}, {break: brk}, {return: rtn}), choice('<', '>', '<=', '>=', '!<', '!>', 'is', '!is'), call($, '_expression', {block}, {break: brk}, {return: rtn}))), 'block', 'break', 'return'),
		...parameterize('expression_equality',       ({block, break: brk, return: rtn}) => $ => prec.left (3, seq(call($, '_expression', {block}, {break: brk}, {return: rtn}), choice('===', '!==', '==', '!='),                      call($, '_expression', {block}, {break: brk}, {return: rtn}))), 'block', 'break', 'return'),
		...parameterize('expression_conjunctive',    ({block, break: brk, return: rtn}) => $ => prec.left (2, seq(call($, '_expression', {block}, {break: brk}, {return: rtn}), choice('&&', '!&'),                                    call($, '_expression', {block}, {break: brk}, {return: rtn}))), 'block', 'break', 'return'),
		...parameterize('expression_disjunctive',    ({block, break: brk, return: rtn}) => $ => prec.left (1, seq(call($, '_expression', {block}, {break: brk}, {return: rtn}), choice('||', '!|'),                                    call($, '_expression', {block}, {break: brk}, {return: rtn}))), 'block', 'break', 'return'),

		...parameterize('expression_conditional', ({break: brk, return: rtn}) => $ => seq(
			'if',
			call($, '_expression', 'block', {break: brk}, {return: rtn}),
			'then',
			call($, '_expression', {break: brk}, {return: rtn}),
			'else',
			call($, '_expression', {break: brk}, {return: rtn}),
		), 'break', 'return'),

		...parameterize('expression_switch', ({break: brk, return: rtn}) => $ => seq(
			'switch',
			field('expression_0', call($, '_expression', 'block', {break: brk}, {return: rtn})),
			repeat(call($, 'case_switch', {break: brk}, {return: rtn})),
			'default',
			field('expression_1', call($, '_expression', 'block', {break: brk}, {return: rtn})),
		), 'break', 'return'),

		/* eslint-disable @stylistic/function-call-argument-newline */
		expression_function: $ => seq(
			'\\', '(', optional($._parameters_function), ')',
			':', choice('void', field('type_0', $._type)),
			field('block_0', call($, 'block', {break: false}, 'return')),
		),
		/* eslint-enable @stylistic/function-call-argument-newline */

		...parameterize('_expression', ({block, break: brk, return: rtn}) => $ => choice(
			call($, '_expression_unit', {block}, {break: brk}, {return: rtn}),

			alias(call($, 'expression_compound',       {block}, {break: brk}, {return: rtn}), $.expression_compound),
			alias(call($, 'expression_unary_symbol',   {block}, {break: brk}, {return: rtn}), $.expression_unary_symbol),
			alias(call($, 'expression_cast',           {block}, {break: brk}, {return: rtn}), $.expression_cast),
			alias(call($, 'expression_exponential',    {block}, {break: brk}, {return: rtn}), $.expression_exponential),
			alias(call($, 'expression_multiplicative', {block}, {break: brk}, {return: rtn}), $.expression_multiplicative),
			alias(call($, 'expression_additive',       {block}, {break: brk}, {return: rtn}), $.expression_additive),
			alias(call($, 'expression_comparative',    {block}, {break: brk}, {return: rtn}), $.expression_comparative),
			alias(call($, 'expression_equality',       {block}, {break: brk}, {return: rtn}), $.expression_equality),
			alias(call($, 'expression_conjunctive',    {block}, {break: brk}, {return: rtn}), $.expression_conjunctive),
			alias(call($, 'expression_disjunctive',    {block}, {break: brk}, {return: rtn}), $.expression_disjunctive),

			call($, 'expression_conditional', {break: brk}, {return: rtn}),
			call($, 'expression_switch',      {break: brk}, {return: rtn}),
			$.expression_function,
		), 'block', 'break', 'return'),


		/* ## Statements */
		...parameterize('assignee', ({break: brk, return: rtn}) => $ => choice(
			field('identifier_0', $.identifier),
			seq(field('expression_0', call($, '_expression', 'block', {break: brk}, {return: rtn})), '.', field('property_accessor_0', call($, 'property_accessor', {break: brk}, {return: rtn}))),
		), 'break', 'return'),

		...parameterize('statement_expression', ({break: brk, return: rtn}) => $ => seq(optional(call($, '_expression', 'block', {break: brk}, {return: rtn})), ';'), 'break', 'return'),

		...parameterize('statement_claim',  ({break: brk, return: rtn}) => $ => seq('claim',  call($, 'assignee', {break: brk}, {return: rtn}), ':', $._type,                                                      ';'), 'break', 'return'),
		...parameterize('statement_set',    ({break: brk, return: rtn}) => $ => seq('set',    call($, 'assignee', {break: brk}, {return: rtn}), '=', call($, '_expression', 'block', {break: brk}, {return: rtn}), ';'), 'break', 'return'),
		...parameterize('statement_delete', ({break: brk, return: rtn}) => $ => seq('delete', call($, 'assignee', {break: brk}, {return: rtn}),                                                                    ';'), 'break', 'return'),

		...parameterize('statement_conditional', ({unless, break: brk, return: rtn}) => $ => seq(
			!unless ? 'if' : 'unless',
			field('expression_0', call($, '_expression', 'block', {break: brk}, {return: rtn})),
			'then',
			field('block_0', call($, 'block', {break: brk}, {return: rtn})),
			!unless
				? choice(
					seq(optional(seq('else', field('block_1', call($, 'block', {break: brk}, {return: rtn})))), ';'),
					seq('else', field('statement_conditional_0', call($, 'statement_conditional', {unless}, {break: brk}, {return: rtn}))),
				)
				: ';',
		), 'unless', 'break', 'return'),

		...parameterize('statement_loop', ({return: rtn}) => $ => seq(uSeq(
			seq(choice('while', field('until_0', 'until')), field('expression_0', call($, '_expression', 'block', {return: rtn}))),
			seq('do',                                       field('block_0',      call($, 'block', 'break', {return: rtn}))),
		), ';'), 'return'),

		...parameterize('statement_iteration', ({return: rtn}) => $ => seq(
			'for',
			choice('_', field('identifier_0', $.identifier)),
			':',
			field('type_0', $._type),
			'in',
			field('expression_0', call($, '_expression', 'block', 'break', {return: rtn})),
			'do',
			field('block_0', call($, 'block', 'break', {return: rtn})),
			';',
		), 'return'),

		statement_break:  _$ => seq(choice('break', 'skip'), ';'),
		statement_return: _$ => seq('return',                ';'),

		...parameterize('_statement', ({break: brk, return: rtn}) => $ => choice(
			call($, '_declaration',                          {break: brk}, {return: rtn}),
			call($, 'statement_expression',                  {break: brk}, {return: rtn}),
			call($, 'statement_claim',                       {break: brk}, {return: rtn}),
			call($, 'statement_set',                         {break: brk}, {return: rtn}),
			call($, 'statement_delete',                      {break: brk}, {return: rtn}),
			call($, 'statement_conditional', ['', 'unless'], {break: brk}, {return: rtn}),
			call($, 'statement_loop',                                      {return: rtn}),
			call($, 'statement_iteration',                                 {return: rtn}),
			...iff(brk, $.statement_break),
			...iff(rtn, $.statement_return),
		), 'break', 'return'),

		...parameterize('block', ({break: brk, return: rtn}) => $ => seq('{', repeat1(call($, '_statement', {break: brk}, {return: rtn})), '}'), 'break', 'return'),

		declaration_type: $ => seq('type', choice('_', field('identifier_0', $.identifier)), '=', field('type_0', $._type), ';'),

		...parameterize('declaration_variable', ({break: brk, return: rtn}) => $ => choice(
			seq('val', choice('_', seq(optional(field('mut_0', 'mut')), field('identifier_0', $.identifier))),      optional(seq(':', field('type_0', $._type))), '=', field('expression_0', call($, '_expression', 'block', {break: brk}, {return: rtn})), ';'),
			seq('val',                          field('mut_0', 'mut'),  field('identifier_0', $.identifier),   '?',              ':', field('type_0', $._type),                                                                                             ';'),
		), 'break', 'return'),

		/* eslint-disable @stylistic/function-call-argument-newline */
		declaration_function: $ => seq(
			'func', choice('_', field('identifier_0', $.identifier)),
			'(', optional($._parameters_function), ')',
			':', choice('void', field('type_0', $._type)),
			field('block_0', call($, 'block', {break: false}, 'return')),
		),
		/* eslint-enable @stylistic/function-call-argument-newline */

		...parameterize('_declaration', ({break: brk, return: rtn}) => $ => choice(
			$.declaration_type,
			call($, 'declaration_variable', {break: brk}, {return: rtn}),
			$.declaration_function,
		), 'break', 'return'),
	},

	extras: $ => [
		/[ \t\n]+/, // whitespace
		$._comment,
	],

	/**
	 * Uses the GLR algorithm to resolve *intended conflicts* in the grammar.
	 * @see https://tree-sitter.github.io/tree-sitter/creating-parsers/2-the-grammar-dsl.html
	 */
	conflicts: $ => [
		// example:
		// familyNameAll('entry_type', ['named', 'optional']).map((rulename) => $[rulename]),
		[$.word, $.primitive_literal],
		[$.word, $._type_unit],
		[$._parameters_type],
		[$._parameters_function],
	],

	/**
	 * Tries to match `$.identifier` first before matching any keyword literals in the grammar.
	 * @see https://tree-sitter.github.io/tree-sitter/creating-parsers/3-writing-the-grammar.html#keyword-extraction
	 */
	word: $ => $.identifier,

	supertypes: $ => [
		$._type_unit,
		$._type,
		...familyNameAll('_expression_unit', ['block', 'break']).map((rulename) => $[rulename]),
		...familyNameAll('_expression',      ['block', 'break']).map((rulename) => $[rulename]),
		...familyNameAll('_statement',       ['break']).map((rulename) => $[rulename]),
		...familyNameAll('_declaration',     ['break']).map((rulename) => $[rulename]),
	],

	reserved: {
		global: _$ => [
			// operator
			'mut',
			'as',
			'is',
			'if',
			'then',
			'else',
			'switch',
			'case',
			'default',
			// storage
			'type',
			'val',
			'func',
			'claim',
			'set',
			'delete',
			'_',
			'void',
			// modifier
			'nominal',
			// control
			'unless',
			'while',
			'until',
			'for',
			'in',
			'do',
			'break',
			'skip',
			'return',
			// type keyword
			'nothing',
			'bool',
			'sym',
			'int',
			'nat',
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
