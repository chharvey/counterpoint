import type {SyntaxNode} from 'tree-sitter';



export type SyntaxNodeType<T extends string> = SyntaxNode & {type: T} & {isNamed: true};



export function isSyntaxNodeType                  (node: SyntaxNode, regex: RegExp):             boolean;
export function isSyntaxNodeType<T extends string>(node: SyntaxNode, type: T):                   node is SyntaxNodeType<T>;
export function isSyntaxNodeType<T extends string>(node: SyntaxNode, type_or_regex: T | RegExp): node is SyntaxNodeType<T> {
	return node.isNamed && ((typeof type_or_regex === 'string')
		? node.type === type_or_regex
		: type_or_regex.test(node.type));
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
	| SyntaxNodeType<'string_template'>
	| SyntaxNodeType<'expression_grouped'>
	| SyntaxNodeType<'tuple_literal'>
	| SyntaxNodeType<'record_literal'>
	| SyntaxNodeType<'set_literal'>
	| SyntaxNodeType<'map_literal'>
	| SyntaxNodeType<'expression_compound'>
	| SyntaxNodeType<'expression_unary_symbol'>
	| SyntaxNodeType<'expression_claim'>
	| SyntaxNodeType<'expression_exponential'>
	| SyntaxNodeType<'expression_multiplicative'>
	| SyntaxNodeType<'expression_additive'>
	| SyntaxNodeType<'expression_comparative'>
	| SyntaxNodeType<'expression_equality'>
	| SyntaxNodeType<'expression_conjunctive'>
	| SyntaxNodeType<'expression_disjunctive'>
	| SyntaxNodeType<'expression_conditional'>
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
		['expression',  (node) => isSyntaxNodeType(node, /^identifier|primitive_literal|string_template|expression_grouped|tuple_literal|record_literal|set_literal|map_literal|expression_compound|expression_unary_symbol|expression_claim|expression_exponential|expression_multiplicative|expression_additive|expression_comparative|expression_equality|expression_conjunctive|expression_disjunctive|expression_conditional$/)],
		['declaration', (node) => isSyntaxNodeType(node, /^declaration_type|declaration_variable$/)],
		['statement',   (node) => isSyntaxNodeType(node, /^statement_expression|statement_assignment$/) || isSyntaxNodeSupertype(node, 'declaration')],
	]).get(category)!(node);
}