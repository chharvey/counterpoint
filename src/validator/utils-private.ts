import type {SyntaxNode} from 'tree-sitter';
import type {NonemptyArray} from './package.js';



export type SyntaxNodeType<T extends string> = SyntaxNode & {type: T} & {isNamed: true};



export function isSyntaxNodeType                  (node: SyntaxNode, regex: RegExp):             boolean;
export function isSyntaxNodeType<T extends string>(node: SyntaxNode, type: T):                   node is SyntaxNodeType<T>;
export function isSyntaxNodeType<T extends string>(node: SyntaxNode, type_or_regex: T | RegExp): node is SyntaxNodeType<T> {
	return node.isNamed && ((typeof type_or_regex === 'string')
		? node.type === type_or_regex
		: type_or_regex.test(node.type));
}



type Join<Strings extends NonemptyArray<string>> =
	Strings extends [infer S0, ...infer SRest]
		? `${ S0 extends string ? '' | `__${ S0 }` : '' }${ SRest extends NonemptyArray<string> ? `${ Join<SRest> }` : '' }`
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
	| SyntaxNodeType<'type_hash_literal'>
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



export function isSyntaxNodeSupertype<C extends Category>(node: SyntaxNode, category: C): node is SyntaxNodeSupertype<C> {
	return new Map<Category, (node: SyntaxNode) => boolean>([
		['type',        (node) => isSyntaxNodeType(node, /^keyword_type|identifier|primitive_literal|type_grouped|type_tuple_literal|type_record_literal|type_hash_literal|type_map_literal|type_compound|type_unary_symbol|type_unary_keyword|type_intersection|type_union$/)],
		['expression',  (node) => isSyntaxNodeType(node, /^identifier|primitive_literal|string_template(__variable)?|expression_grouped(__variable)?|(tuple|record)_literal(__variable)?|(set|map)_literal|expression_(compound|unary_symbol|claim|exponential|multiplicative|additive|comparative|equality|conjunctive|disjunctive|conditional)(__variable)?$/)],
		['declaration', (node) => isSyntaxNodeType(node, /^declaration_type|declaration_variable$/)],
		['statement',   (node) => isSyntaxNodeType(node, /^statement_expression|statement_assignment$/) || isSyntaxNodeSupertype(node, 'declaration')],
	]).get(category)!(node);
}
