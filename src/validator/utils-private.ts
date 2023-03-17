import * as xjs from 'extrajs';
import type {SyntaxNode} from 'tree-sitter';
import utf8 from 'utf8'; // need `tsconfig.json#compilerOptions.allowSyntheticDefaultImports = true`
import type {
	NonemptyArray,
	CodeUnit,
} from '../lib/index.js';



export type SyntaxNodeType<T extends string> = SyntaxNode & {readonly type: T} & {readonly isNamed: true};



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



export function isSyntaxNodeType                  (node: SyntaxNode, regex: RegExp):             boolean;
export function isSyntaxNodeType<T extends string>(node: SyntaxNode, type: T):                   node is SyntaxNodeType<T>;
export function isSyntaxNodeType<T extends string>(node: SyntaxNode, type_or_regex: T | RegExp): node is SyntaxNodeType<T> {
	return node.isNamed && ((typeof type_or_regex === 'string')
		? node.type === type_or_regex
		: type_or_regex.test(node.type));
}



type Join<Strings extends NonemptyArray<string>> =
	Strings extends [infer S0, ...infer SRest]
		? `${ S0 extends string ? '' | `__${ S0 }` : '' }${ SRest extends NonemptyArray<string> ? Join<SRest> : '' }`
		: '';
export type SyntaxNodeFamily<Name extends string, Suffices extends NonemptyArray<string>> =
	SyntaxNodeType<`${ Name }${ Join<Suffices> }`>;



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
	| SyntaxNodeType<'type_grouped'>
	| SyntaxNodeType<'type_tuple_literal'>
	| SyntaxNodeType<'type_record_literal'>
	| SyntaxNodeType<'type_dict_literal'>
	| SyntaxNodeType<'type_map_literal'>
	| SyntaxNodeType<'type_compound'>
	| SyntaxNodeType<'type_unary_symbol'>
	| SyntaxNodeType<'type_unary_keyword'>
	| SyntaxNodeType<'type_intersection'>
	| SyntaxNodeType<'type_union'>
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
		['type',        (node) => isSyntaxNodeType(node, /^keyword_type|identifier|primitive_literal|type_grouped|type_tuple_literal|type_record_literal|type_dict_literal|type_map_literal|type_compound|type_unary_symbol|type_unary_keyword|type_intersection|type_union$/)],
		['expression',  (node) => isSyntaxNodeType(node, /^identifier|primitive_literal|string_template(__variable)?|expression_grouped(__variable)?|(tuple|record)_literal(__variable)?|(set|map)_literal|expression_(compound|unary_symbol|exponential|multiplicative|additive|comparative|equality|conjunctive|disjunctive|conditional)(__variable)?$/)],
		['declaration', (node) => isSyntaxNodeType(node, /^declaration_type|declaration_variable$/)],
		['statement',   (node) => isSyntaxNodeType(node, /^statement_expression|statement_assignment$/) || isSyntaxNodeSupertype(node, 'declaration')],
	]).get(category)!(syntaxnode);
}



/**
 * The UTF-8 encoding of a numeric code point value.
 * @param   codepoint a Unicode code point
 * @returns           a code unit sequence representing the code point
 */
export function utf8Encode(codepoint: CodePoint): EncodedChar {
	xjs.Number.assertType(codepoint, xjs.NumericType.NATURAL);
	return [...utf8.encode(String.fromCodePoint(codepoint))].map((ch) => ch.codePointAt(0)!) as EncodedChar;
}
