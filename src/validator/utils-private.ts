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
	| SyntaxNodeFamily<'string_template',           ['break', 'return']>
	| SyntaxNodeFamily<'expression_grouped',        ['break', 'return']>
	| SyntaxNodeFamily<'expression_tuple_literal',  ['break', 'return']>
	| SyntaxNodeFamily<'expression_record_literal', ['break', 'return']>
	| SyntaxNodeFamily<'expression_list_literal',   ['break', 'return']>
	| SyntaxNodeFamily<'expression_dict_literal',   ['break', 'return']>
	| SyntaxNodeFamily<'expression_set_literal',    ['break', 'return']>
	| SyntaxNodeFamily<'expression_map_literal',    ['break', 'return']>
	// NOTE: the following expression types (`_block` through `_disjunctive`) refer to aliases in the grammar --- no need for suffices
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
	| SyntaxNodeFamily<'expression_conditional', ['break', 'return']>
	| SyntaxNodeFamily<'expression_switch',      ['break', 'return']>
	| SyntaxNodeType<'expression_function'>
) : C extends 'statement' ? (
	| SyntaxNodeSupertype<'declaration'>
	| SyntaxNodeFamily<'statement_expression',  [          'break', 'return']>
	| SyntaxNodeFamily<'statement_claim',       [          'break', 'return']>
	| SyntaxNodeFamily<'statement_set',         [          'break', 'return']>
	| SyntaxNodeFamily<'statement_delete',      [          'break', 'return']>
	| SyntaxNodeFamily<'statement_conditional', ['unless', 'break', 'return']>
	| SyntaxNodeFamily<'statement_loop',        [                   'return']>
	| SyntaxNodeFamily<'statement_iteration',   [                   'return']>
	| SyntaxNodeType<'statement_break'>
	| SyntaxNodeFamily<'statement_return', ['break']>
) : C extends 'declaration' ? (
	| SyntaxNodeType<'declaration_type'>
	| SyntaxNodeFamily<'declaration_variable', ['break', 'return']>
) : never;



export function isSyntaxNodeSupertype<C extends Category>(syntaxnode: SyntaxNode | null, category: C): syntaxnode is SyntaxNodeSupertype<C> {
	if (!syntaxnode) {
		return false;
	}
	return new Map<Category, (node: SyntaxNode) => boolean>([
		['type',        (node) => isSyntaxNodeType(node, /^identifier|keyword_type|primitive_literal|type_grouped|type_(tuple|record|list|dict|set|map)_literal|type_(compound|unary_(symbol|keyword)|intersection|union)$/)],
		['expression',  (node) => isSyntaxNodeType(node, /^identifier|primitive_literal|string_template(__break)?(__return)?|expression_(grouped|(tuple|record|list|dict|set|map)_literal)(__break)?(__return)?|expression_block|expression_(compound|unary_symbol|cast|exponential|multiplicative|additive|comparative|equality|conjunctive|disjunctive|conditional(__break)?(__return)?|switch(__break)?(__return)?)$/)],
		['statement',   (node) => isSyntaxNodeType(node, /^statement_((expression|claim|set|delete)(__break)?(__return)?|conditional(__unless)?(__break)?(__return)?|(loop|iteration)(__return)?|break|return(__break)?)$/) || isSyntaxNodeSupertype(node, 'declaration')],
		['declaration', (node) => isSyntaxNodeType(node, /^declaration_(type|variable(__break)?(__return)?)$/)],
	]).get(category)!(syntaxnode);
}
