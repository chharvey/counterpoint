import * as xjs from 'extrajs';
import type {SyntaxNode} from 'tree-sitter';
import utf8 from 'utf8'; // need `tsconfig.json#compilerOptions.allowSyntheticDefaultImports = true`
import type {
	NonemptyArray,
	CodeUnit,
} from '../lib/index.js';



export type SyntaxNodeType<T extends string> =
	& SyntaxNode
	& {readonly isNamed: true}
	& {readonly type: T};



export function isSyntaxNodeType                  (node: SyntaxNode, regex: RegExp):             boolean;
export function isSyntaxNodeType<T extends string>(node: SyntaxNode, type: T):                   node is SyntaxNodeType<T>;
export function isSyntaxNodeType<T extends string>(node: SyntaxNode, type_or_regex: T | RegExp): node is SyntaxNodeType<T> {
	return node.isNamed && ((typeof type_or_regex === 'string')
		? node.type === type_or_regex
		: type_or_regex.test(node.type));
}



type Join<Strings extends Readonly<NonemptyArray<string>>> =
	Strings extends [infer S0, ...infer SRest]
		? `${ S0 extends string ? '' | `__${ S0 }` : '' }${ SRest extends Readonly<NonemptyArray<string>> ? Join<SRest> : '' }`
		: '';



export type SyntaxNodeFamily<Name extends string, Suffices extends Readonly<NonemptyArray<string>>> =
	SyntaxNodeType<`${ Name }${ Join<Suffices> }`>;



// NOTE: copied from `../../tree-sitter-counterpoint/grammar.ts`
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



export function isSyntaxNodeFamily<
	Name extends string,
	const Suffices extends Readonly<NonemptyArray<string>>, // `const ‹TypeParam›` prevents the need to pass in `‹expr› as const` every time
>(node: SyntaxNode, name: Name, suffices: Suffices): node is SyntaxNodeFamily<Name, Suffices> {
	return familyNameAll(name, suffices).some((familyname) => isSyntaxNodeType(node, familyname));
}



type Category =
	| 'type'
	| 'expression'
	| 'declaration'
	| 'statement'
;



export type SyntaxNodeSupertype<C extends Category> = C extends 'type' ?
	| SyntaxNodeType<'keyword_type'>
	| SyntaxNodeType<'identifier'>
	| SyntaxNodeType<'primitive_literal'>
	| SyntaxNodeFamily<'type_grouped',        ['variable']>
	| SyntaxNodeFamily<'type_tuple_literal',  ['variable']>
	| SyntaxNodeFamily<'type_record_literal', ['variable']>
	| SyntaxNodeType<'type_dict_literal'>
	| SyntaxNodeType<'type_map_literal'>
	| SyntaxNodeFamily<'type_compound',      ['variable']>
	| SyntaxNodeFamily<'type_unary_symbol',  ['variable']>
	| SyntaxNodeFamily<'type_unary_keyword', ['variable']>
	| SyntaxNodeFamily<'type_intersection',  ['variable']>
	| SyntaxNodeFamily<'type_union',         ['variable']>
: C extends 'expression' ?
	| SyntaxNodeType<'identifier'>
	| SyntaxNodeType<'primitive_literal'>
	| SyntaxNodeFamily<'string_template',    ['variable']>
	| SyntaxNodeFamily<'expression_grouped', ['variable']>
	| SyntaxNodeFamily<'tuple_literal',      ['variable']>
	| SyntaxNodeFamily<'record_literal',     ['variable']>
	| SyntaxNodeType<'set_literal'>
	| SyntaxNodeType<'map_literal'>
	| SyntaxNodeFamily<'expression_compound',       ['variable']>
	| SyntaxNodeFamily<'expression_unary_symbol',   ['variable']>
	| SyntaxNodeFamily<'expression_claim',          ['variable']>
	| SyntaxNodeFamily<'expression_exponential',    ['variable']>
	| SyntaxNodeFamily<'expression_multiplicative', ['variable']>
	| SyntaxNodeFamily<'expression_additive',       ['variable']>
	| SyntaxNodeFamily<'expression_comparative',    ['variable']>
	| SyntaxNodeFamily<'expression_equality',       ['variable']>
	| SyntaxNodeFamily<'expression_conjunctive',    ['variable']>
	| SyntaxNodeFamily<'expression_disjunctive',    ['variable']>
	| SyntaxNodeFamily<'expression_conditional',    ['variable']>
: C extends 'declaration' ?
	| SyntaxNodeType<'declaration_type'>
	| SyntaxNodeType<'declaration_variable'>
: C extends 'statement' ?
	| SyntaxNodeSupertype<'declaration'>
	| SyntaxNodeType<'statement_expression'>
	| SyntaxNodeType<'statement_assignment'>
: never;



export function isSyntaxNodeSupertype<C extends Category>(syntaxnode: SyntaxNode, category: C): syntaxnode is SyntaxNodeSupertype<C> {
	return new Map<Category, (node: SyntaxNode) => boolean>([
		['type',        (node) => isSyntaxNodeType(node, /^keyword_type|identifier|primitive_literal|type_grouped(__variable)?|type_tuple_literal(__variable)?|type_record_literal(__variable)?|type_dict_literal|type_map_literal|type_compound(__variable)?|type_unary_symbol(__variable)?|type_unary_keyword(__variable)?|type_intersection(__variable)?|type_union(__variable)?$/)],
		['expression',  (node) => isSyntaxNodeType(node, /^identifier|primitive_literal|string_template(__variable)?|expression_grouped(__variable)?|(tuple|record)_literal(__variable)?|(set|map)_literal|expression_(compound|unary_symbol|claim|exponential|multiplicative|additive|comparative|equality|conjunctive|disjunctive|conditional)(__variable)?$/)],
		['declaration', (node) => isSyntaxNodeType(node, /^declaration_type|declaration_variable$/)],
		['statement',   (node) => isSyntaxNodeType(node, /^statement_expression|statement_assignment$/) || isSyntaxNodeSupertype(node, 'declaration')],
	]).get(category)!(syntaxnode);
}



/**
 * A code point is an integer within the closed interval [0, 0x10_ffff] that represents
 * the index of a character in the Unicode Universal Character Set.
 */
type CodePoint = number;



/**
 * An encoded character is a sequence of code units
 * that corresponds to a single code point in the UTF-8 encoding.
 */
type EncodedChar =
	| [CodeUnit]
	| [CodeUnit, CodeUnit]
	| [CodeUnit, CodeUnit, CodeUnit]
	| [CodeUnit, CodeUnit, CodeUnit, CodeUnit]
;



/**
 * The UTF-8 encoding of a numeric code point value.
 * @param   codepoint a Unicode code point
 * @returns           a code unit sequence representing the code point
 */
export function utf8Encode(codepoint: CodePoint): EncodedChar {
	xjs.Number.assertType(codepoint, xjs.NumericType.NATURAL);
	return [...utf8.encode(String.fromCodePoint(codepoint))].map((ch) => ch.codePointAt(0)!) as EncodedChar;
}
