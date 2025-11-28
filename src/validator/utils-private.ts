import * as xjs from 'extrajs';
import type {SyntaxNode} from 'tree-sitter';
import utf8 from 'utf8'; // need `tsconfig.json#compilerOptions.allowSyntheticDefaultImports = true`
import type {
	NonemptyArray,
	CodeUnit,
} from '../lib/index.ts';



export type SyntaxNodeType<T extends string> = (
	& SyntaxNode
	& {readonly isNamed: true}
	& {readonly type: T}
);



export function isSyntaxNodeType                  (node: SyntaxNode, regex: RegExp):             boolean;
export function isSyntaxNodeType<T extends string>(node: SyntaxNode, type: T):                   node is SyntaxNodeType<T>;
export function isSyntaxNodeType<T extends string>(node: SyntaxNode, type_or_regex: T | RegExp): node is SyntaxNodeType<T> {
	return node.isNamed && ((typeof type_or_regex === 'string')
		? node.type === type_or_regex
		: type_or_regex.test(node.type));
}



type Join<Strings extends Readonly<NonemptyArray<string>>> = Strings extends [infer S0, ...infer SRest]
	? `${ S0 extends string ? '' | `__${ S0 }` : '' }${ SRest extends Readonly<NonemptyArray<string>> ? Join<SRest> : '' }`
	: '';



export type SyntaxNodeFamily<Name extends string, Suffices extends Readonly<NonemptyArray<string>>> = SyntaxNodeType<`${ Name }${ Join<Suffices> }`>;



// NOTE: copied from `../../tree-sitter-counterpoint/grammar.ts`
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



export function isSyntaxNodeFamily<
	Name extends string,
	const Suffices extends Readonly<NonemptyArray<string>>, // `const ‹TypeParam›` prevents the need to pass in `‹expr› as const` every time
>(node: SyntaxNode, name: Name, suffices: Suffices): node is SyntaxNodeFamily<Name, Suffices> {
	return familyNameAll(name, suffices).some((familyname) => isSyntaxNodeType(node, familyname));
}



type Category = (
	| 'type'
	| 'expression'
	| 'declaration'
	| 'statement'
);



export type SyntaxNodeSupertype<C extends Category> = C extends 'type' ? (
	| SyntaxNodeType<'identifier'>
	| SyntaxNodeType<'keyword_type'>
	| SyntaxNodeType<'primitive_literal'>
	| SyntaxNodeType<'type_grouped'>
	| SyntaxNodeType<'type_tuple_literal'>
	| SyntaxNodeType<'type_record_literal'>
	| SyntaxNodeType<'type_list_literal'>
	| SyntaxNodeType<'type_dict_literal'>
	| SyntaxNodeType<'type_set_literal'>
	| SyntaxNodeType<'type_map_literal'>
	| SyntaxNodeType<'type_compound'>
	| SyntaxNodeType<'type_unary_symbol'>
	| SyntaxNodeType<'type_unary_keyword'>
	| SyntaxNodeType<'type_intersection'>
	| SyntaxNodeType<'type_union'>
) : C extends 'expression' ? (
	| SyntaxNodeType<'identifier'>
	| SyntaxNodeType<'primitive_literal'>
	| SyntaxNodeFamily<'string_template',    ['break']>
	| SyntaxNodeFamily<'expression_grouped', ['break']>
	| SyntaxNodeFamily<'tuple_literal',      ['break']>
	| SyntaxNodeFamily<'record_literal',     ['break']>
	| SyntaxNodeFamily<'list_literal',       ['break']>
	| SyntaxNodeFamily<'dict_literal',       ['break']>
	| SyntaxNodeFamily<'set_literal',        ['break']>
	| SyntaxNodeFamily<'map_literal',        ['break']>
	| SyntaxNodeType<'expression_block'>
	| SyntaxNodeType<'expression_compound'>
	| SyntaxNodeType<'expression_unary_symbol'>
	| SyntaxNodeType<'expression_cast'>
	| SyntaxNodeType<'expression_exponential'>
	| SyntaxNodeType<'expression_multiplicative'>
	| SyntaxNodeType<'expression_additive'>
	| SyntaxNodeType<'expression_comparative'>
	| SyntaxNodeType<'expression_equality'>
	| SyntaxNodeType<'expression_conjunctive'>
	| SyntaxNodeType<'expression_disjunctive'>
	| SyntaxNodeFamily<'expression_conditional', ['break']>
) : C extends 'statement' ? (
	| SyntaxNodeSupertype<'declaration'>
	| SyntaxNodeFamily<'statement_expression',   ['break']>
	| SyntaxNodeFamily<'statement_claim',        ['break']>
	| SyntaxNodeFamily<'statement_reassignment', ['break']>
	| SyntaxNodeFamily<'statement_conditional',  ['unless', 'break']>
	| SyntaxNodeType<'statement_loop'>
	| SyntaxNodeType<'statement_iteration'>
	| SyntaxNodeType<'statement_break'>
) : C extends 'declaration' ? (
	| SyntaxNodeType<'declaration_type'>
	| SyntaxNodeFamily<'declaration_variable', ['break']>
) : never;



export function isSyntaxNodeSupertype<C extends Category>(syntaxnode: SyntaxNode, category: C): syntaxnode is SyntaxNodeSupertype<C> {
	return new Map<Category, (node: SyntaxNode) => boolean>([
		['type',        (node) => isSyntaxNodeType(node, /^identifier|keyword_type|primitive_literal|type_grouped|type_(tuple|record|list|dict|set|map)_literal|type_(compound|unary_(symbol|keyword)|intersection|union)$/)],
		['expression',  (node) => isSyntaxNodeType(node, /^identifier|primitive_literal|string_template(__break)?|expression_grouped(__break)?|(tuple|record|list|dict|set|map)_literal(__break)?|expression_block|expression_(compound|unary_(symbol|keyword)|cast|exponential|multiplicative|additive|comparative|equality|conjunctive|disjunctive|conditional(__break)?)$/)],
		['statement',   (node) => isSyntaxNodeType(node, /^declaration|statement_(expression(__break)?|claim(__break)?|reassignment(__break)?|conditional(__unless)?(__break)?|loop|iteration|break)$/) || isSyntaxNodeSupertype(node, 'declaration')],
		['declaration', (node) => isSyntaxNodeType(node, /^declaration_(type|variable(__break)?)$/)],
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
type EncodedChar = (
	| [CodeUnit]
	| [CodeUnit, CodeUnit]
	| [CodeUnit, CodeUnit, CodeUnit]
	| [CodeUnit, CodeUnit, CodeUnit, CodeUnit]
);



/**
 * The UTF-8 encoding of a numeric code point value.
 * @param   codepoint a Unicode code point
 * @returns           a code unit sequence representing the code point
 */
export function utf8Encode(codepoint: CodePoint): EncodedChar {
	xjs.Number.assertType(codepoint, xjs.NumericType.NATURAL);
	return [...utf8.encode(String.fromCodePoint(codepoint))].map((ch) => ch.codePointAt(0)!) as EncodedChar;
}
