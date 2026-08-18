import type {SyntaxNode} from 'tree-sitter';
import type {NonemptyArray} from '../lib/index.ts';



export type SyntaxNodeType<T extends string> = (
	& SyntaxNode
	& {readonly isNamed: true}
	& {readonly type: T}
);



export function isSyntaxNodeType                  (node: SyntaxNode | null, regex: RegExp):             boolean; // eslint-disable-line @stylistic/space-before-function-paren
export function isSyntaxNodeType<T extends string>(node: SyntaxNode | null, type: T):                   node is SyntaxNodeType<T>;
export function isSyntaxNodeType<T extends string>(node: SyntaxNode | null, type_or_regex: T | RegExp): node is SyntaxNodeType<T> {
	if (!node) {
		return false;
	}
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
>(node: SyntaxNode | null, name: Name, suffices: Suffices): node is SyntaxNodeFamily<Name, Suffices> {
	if (!node) {
		return false;
	}
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
	| SyntaxNodeFamily<'string_template',           ['break']>
	| SyntaxNodeFamily<'expression_grouped',        ['break']>
	| SyntaxNodeFamily<'expression_tuple_literal',  ['break']>
	| SyntaxNodeFamily<'expression_record_literal', ['break']>
	| SyntaxNodeFamily<'expression_list_literal',   ['break']>
	| SyntaxNodeFamily<'expression_dict_literal',   ['break']>
	| SyntaxNodeFamily<'expression_set_literal',    ['break']>
	| SyntaxNodeFamily<'expression_map_literal',    ['break']>
	// NOTE: the following expression types (`_block` through `_disjunctive`) refer to aliases in the grammar --- no need for suffices
	| SyntaxNodeType<'expression_block'>
	| SyntaxNodeType<'expression_compound'>
	| SyntaxNodeType<'expression_unary_symbol'>
	| SyntaxNodeType<'expression_unary_keyword'>
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
	| SyntaxNodeFamily<'statement_expression',  ['break']>
	| SyntaxNodeFamily<'statement_claim',       ['break']>
	| SyntaxNodeFamily<'statement_set',         ['break']>
	| SyntaxNodeFamily<'statement_delete',      ['break']>
	| SyntaxNodeFamily<'statement_conditional', ['unless', 'break']>
	| SyntaxNodeType<'statement_loop'>
	| SyntaxNodeType<'statement_iteration'>
	| SyntaxNodeType<'statement_break'>
) : C extends 'declaration' ? (
	| SyntaxNodeType<'declaration_type'>
	| SyntaxNodeFamily<'declaration_variable', ['break']>
) : never;



export function isSyntaxNodeSupertype<C extends Category>(syntaxnode: SyntaxNode | null, category: C): syntaxnode is SyntaxNodeSupertype<C> {
	if (!syntaxnode) {
		return false;
	}
	return new Map<Category, (node: SyntaxNode) => boolean>([
		['type',        (node) => isSyntaxNodeType(node, /^identifier|keyword_type|primitive_literal|type_grouped|type_(tuple|record|list|dict|set|map)_literal|type_(compound|unary_(symbol|keyword)|intersection|union)$/)],
		['expression',  (node) => isSyntaxNodeType(node, /^identifier|primitive_literal|string_template(__break)?|expression_(grouped|(tuple|record|list|dict|set|map)_literal)(__break)?|expression_block|expression_(compound|unary_(symbol|keyword)|cast|exponential|multiplicative|additive|comparative|equality|conjunctive|disjunctive|conditional(__break)?)$/)],
		['statement',   (node) => isSyntaxNodeType(node, /^declaration|statement_((expression|claim|set|delete)(__break)?|conditional(__unless)?(__break)?|loop|iteration|break)$/) || isSyntaxNodeSupertype(node, 'declaration')],
		['declaration', (node) => isSyntaxNodeType(node, /^declaration_(type|variable(__break)?)$/)],
	]).get(category)!(syntaxnode);
}
